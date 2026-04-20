# Deployment Guide

This guide covers deploying DocMind AI to production environments.

## Prerequisites

- Docker and Docker Compose (for containerized deployment)
- Cloud provider account (AWS, GCP, Azure, or Heroku)
- Domain name (optional but recommended)
- SSL certificate (for HTTPS)

## Local Deployment

### Using Docker (Recommended)

#### 1. Create Dockerfile for Backend

Create `Dockerfile` in project root:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend_app.py .

EXPOSE 8000

CMD ["python", "backend_app.py"]
```

#### 2. Create Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: .
    container_name: docmind-backend
    ports:
      - "8000:8000"
    environment:
      - BACKEND_HOST=0.0.0.0
      - BACKEND_PORT=8000
    volumes:
      - ./backend_app.py:/app/backend_app.py
    restart: unless-stopped

  frontend:
    build:
      context: ./rag-document-ai/next-monorepo
      dockerfile: Dockerfile.next
    container_name: docmind-frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  backend_data:
```

#### 3. Create Dockerfile for Frontend

Create `rag-document-ai/next-monorepo/Dockerfile.next`:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps --only=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000

CMD ["npm", "start"]
```

#### 4. Deploy with Docker Compose

```bash
docker-compose up -d
```

## Cloud Deployment

### Option 1: Heroku Deployment

#### Backend

```bash
# Install Heroku CLI
# Login
heroku login

# Create app
heroku create docmind-backend

# Add buildpack
heroku buildpacks:add heroku/python

# Deploy
git push heroku main

# Set environment variables
heroku config:set BACKEND_HOST=0.0.0.0 BACKEND_PORT=8000
```

#### Frontend

```bash
# Create app
heroku create docmind-frontend

# Add buildpack
heroku buildpacks:add heroku/nodejs

# Set environment variables
heroku config:set NEXT_PUBLIC_API_URL=https://docmind-backend.herokuapp.com

# Deploy
git push heroku main
```

### Option 2: AWS Deployment

#### Using Elastic Beanstalk

**Backend:**

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p python-3.11 docmind-backend

# Create environment
eb create docmind-backend-env

# Deploy
eb deploy

# Set environment variables
eb setenv BACKEND_HOST=0.0.0.0 BACKEND_PORT=8000

# Open application
eb open
```

**Frontend:**

```bash
# Initialize
eb init -p node.js-20 docmind-frontend

# Create environment  
eb create docmind-frontend-env

# Deploy
eb deploy

# Set environment variables
eb setenv NEXT_PUBLIC_API_URL=<backend-url>

# Open application
eb open
```

### Option 3: Google Cloud Run

#### Backend

```bash
# Create artifact registry
gcloud artifacts repositories create docmind --location=us-central1 --repository-format=docker

# Build and push
gcloud builds submit --tag us-central1-docker.pkg.dev/$PROJECT_ID/docmind/backend

# Deploy to Cloud Run
gcloud run deploy docmind-backend \
  --image us-central1-docker.pkg.dev/$PROJECT_ID/docmind/backend \
  --platform managed \
  --region us-central1 \
  --set-env-vars BACKEND_HOST=0.0.0.0,BACKEND_PORT=8080

# Copy service URL
```

#### Frontend

```bash
# Build and push
gcloud builds submit --tag us-central1-docker.pkg.dev/$PROJECT_ID/docmind/frontend rag-document-ai/next-monorepo

# Deploy to Cloud Run
gcloud run deploy docmind-frontend \
  --image us-central1-docker.pkg.dev/$PROJECT_ID/docmind/frontend \
  --platform managed \
  --region us-central1 \
  --set-env-vars NEXT_PUBLIC_API_URL=<backend-service-url>

# Copy service URL
```

## Post-Deployment Checklist

- [ ] Verify backend is responding: `curl https://your-backend-url/docs`
- [ ] Verify frontend is loading correctly
- [ ] Test file upload functionality
- [ ] Test chat functionality
- [ ] Monitor error logs
- [ ] Set up monitoring and alerts
- [ ] Set up automated backups
- [ ] Configure custom domain
- [ ] Enable HTTPS/SSL
- [ ] Set up CDN (Cloudflare recommended)

## Environment Variables Setup

### Backend Production
```env
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
```

### Frontend Production
```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

## Performance Optimization

### Backend
- Enable gzip compression
- Add response caching headers
- Monitor memory usage
- Set up database indexes (if using DB)
- Use connection pooling

### Frontend
- Enable ISR (Incremental Static Regeneration)
- Optimize images
- Enable compression
- Use CDN for static assets
- Monitor Core Web Vitals

## Monitoring & Logging

### Recommended Tools
- **Sentry**: Error tracking
- **DataDog**: APM and monitoring
- **Cloudflare**: CDN and DDoS protection
- **LogRocket**: Frontend monitoring
- **ELK Stack**: Centralized logging

## Rollback Procedure

```bash
# If using Heroku
heroku releases
heroku rollback

# If using Docker
docker-compose down
git checkout previous-version
docker-compose up -d

# If using Git
git revert <commit-hash>
git push
# Redeploy based on CI/CD
```

## Security Hardening

1. **Enable HTTPS/SSL**
   ```bash
   # Use Let's Encrypt
   certbot certonly --standalone -d yourdomain.com
   ```

2. **Set Environment Variables**
   - Never commit `.env` files
   - Use cloud provider secret management

3. **Enable CORS Properly**
   - Set specific allowed origins
   - Don't use wildcard (*) in production

4. **API Rate Limiting**
   ```python
   # Add to backend_app.py
   from slowapi import Limiter
   limiter = Limiter(key_func=get_remote_address)
   ```

5. **Security Headers**
   - Set Content-Security-Policy
   - Set X-Frame-Options
   - Set X-Content-Type-Options

## Troubleshooting

### Backend won't start
```bash
# Check logs
docker-compose logs backend

# Verify Python dependencies
pip install -r requirements.txt

# Check port availability
lsof -i :8000
```

### Frontend won't build
```bash
# Clear cache
cd rag-document-ai/next-monorepo
rm -rf .next node_modules

# Reinstall
npm install --legacy-peer-deps

# Rebuild
npm run build
```

### CORS Issues
- Verify backend CORS configuration
- Check frontend API URL
- Ensure both are using same protocol (http/https) or configure properly

## Support

For deployment issues, open an issue on GitHub or contact the team.
