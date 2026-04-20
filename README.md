# DocMind AI - Intelligent Document Analysis

A full-stack Retrieval Augmented Generation (RAG) application for intelligent document analysis, combining a modern Next.js frontend with a FastAPI backend for seamless document processing and AI-powered insights.

![License](https://img.shields.io/badge/license-MIT-blue)
![Python](https://img.shields.io/badge/python-3.9+-blue)
![Node.js](https://img.shields.io/badge/node.js-20+-blue)
![Next.js](https://img.shields.io/badge/next.js-16+-blue)

## ✨ Features

- **📄 Multi-Format Support**: Upload PDF and DOCX files with automatic text extraction
- **🤖 AI-Powered Analysis**: Generate intelligent summaries and extract key insights
- **💬 Smart Chat Interface**: Ask questions about document content with RAG-based retrieval
- **⚡ Real-Time Processing**: Optimized performance with chunking and streaming
- **🎨 Modern UI**: Beautiful, responsive interface built with React and Tailwind CSS
- **🔐 CORS Enabled**: Secure API endpoints with proper cross-origin handling
- **📱 Mobile Responsive**: Works seamlessly on desktop and mobile devices

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│        Frontend (Next.js 16)            │
│  • React 19 with TypeScript            │
│  • Tailwind CSS + Lucide Icons          │
│  • Real-time chat and summaries         │
└──────────────┬──────────────────────────┘
               │
               ├─ HTTP/REST API
               │
┌──────────────▼──────────────────────────┐
│       Backend (FastAPI)                 │
│  • Document extraction (PDF/DOCX)       │
│  • Text chunking & processing           │
│  • API endpoints for extraction         │
└─────────────────────────────────────────┘
```

## 📋 Prerequisites

- **Python** 3.9 or higher
- **Node.js** 20.0 or higher
- **npm** 11.0 or higher
- Modern web browser (Chrome, Firefox, Safari, Edge)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/rag-document-ai.git
cd rag-document-ai
```

### 2. Backend Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# Create and configure environment
cat > .env.local << EOF
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
EOF

# Start FastAPI server (from project root)
python backend_app.py
```

Backend will start on **http://localhost:8000**

### 3. Frontend Setup

```bash
# Navigate to monorepo
cd rag-document-ai/next-monorepo

# Install dependencies
npm install --legacy-peer-deps

# Create environment configuration
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF

# Start development server
npm run dev
```

Frontend will start on **http://localhost:3000**

### 4. Open in Browser

Visit **http://localhost:3000** to use the application!

## 📚 Project Structure

```
rag-document-ai/
├── backend_app.py                 # FastAPI backend server
├── requirements.txt               # Python dependencies
├── .env.local                     # Backend environment config
├── .gitignore                     # Git exclusions
│
└── rag-document-ai/
    └── next-monorepo/             # Turborepo monorepo
        ├── package.json           # Workspace configuration
        ├── turbo.json             # Turborepo config
        ├── .env.local             # Frontend environment config
        │
        ├── apps/
        │   └── web/               # Next.js application
        │       ├── app/
        │       │   ├── page.tsx                # Main dashboard
        │       │   ├── layout.tsx              # Root layout
        │       │   ├── globals.css             # Global styles
        │       │   └── api/extract/route.ts   # Extract endpoint
        │       │
        │       ├── components/
        │       │   ├── UploadZone.tsx         # File upload UI
        │       │   ├── ChatSidebar.tsx        # Chat interface
        │       │   ├── SummaryDisplay.tsx     # Summary display
        │       │   └── theme-provider.tsx     # Theme provider
        │       │
        │       ├── lib/
        │       │   ├── types.ts               # TypeScript types
        │       │   └── utils.ts               # Utilities
        │       │
        │       └── package.json
        │
        └── packages/              # Shared packages
            ├── eslint-config/     # ESLint configurations
            ├── typescript-config/ # TypeScript configurations
            └── ui/                # UI component library
                └── src/
                    ├── components/
                    ├── lib/
                    └── styles/
```

## 🔌 API Endpoints

### Document Extraction

**POST** `/extract`

Upload a file (PDF or DOCX) for text extraction and chunking.

**Request:**
```bash
curl -F "file=@document.pdf" http://localhost:8000/extract
```

**Response:**
```json
{
  "text": "Full extracted text...",
  "chunks": [
    {
      "text": "Chunk 1 text...",
      "index": 0
    },
    {
      "text": "Chunk 2 text...",
      "index": 1
    }
  ]
}
```

**Supported Formats:**
- `.pdf` - PDF documents
- `.docx` - Microsoft Word documents

## 🛠️ Available Scripts

### Backend

```bash
# Start development server (with auto-reload)
python backend_app.py

# Check API documentation
curl http://localhost:8000/docs
```

### Frontend (from `rag-document-ai/next-monorepo`)

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Format code
npm run format

# Type checking
npm run typecheck
```

## 🧪 Testing

### Backend Testing
```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run tests
pytest
```

### Frontend Testing
```bash
cd rag-document-ai/next-monorepo
npm test
```

## 📦 Available Dependencies

### Backend (Python)
- **FastAPI** - Modern web framework
- **Uvicorn** - ASGI server
- **pdfplumber** - PDF text extraction
- **docx2txt** - DOCX text extraction
- **python-multipart** - File upload handling

### Frontend (Node.js)
- **Next.js 16** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Turbo** - Monorepo build system

## 🔒 Security

- CORS properly configured for localhost
- Environment variables secured with `.env.local`
- No sensitive keys committed to repository
- Input validation on file uploads

## 🐛 Troubleshooting

### Port Already in Use

**Backend (8000):**
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :8000
kill -9 <PID>
```

**Frontend (3000):**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

### Dependencies Not Installing

```bash
# Backend
pip install --upgrade pip
pip install -r requirements.txt

# Frontend
cd rag-document-ai/next-monorepo
npm install --legacy-peer-deps --force
```

### Build Errors

```bash
# Clear build cache
cd rag-document-ai/next-monorepo
rm -rf .next .turbo node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
```

## 📝 Environment Variables

### Backend (.env.local)
```env
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
# Optional: OPENAI_API_KEY=your_key_here
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
# Optional: NEXT_PUBLIC_OPENAI_API_KEY=your_key_here
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:
- Code follows the project's linting rules
- All tests pass
- Documentation is updated
- Commit messages are clear and descriptive

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Authors

- **Your Name** - Initial work

## 🙏 Acknowledgments

- FastAPI and Uvicorn teams for the excellent backend framework
- Next.js and Vercel for the amazing frontend framework
- pdfplumber and docx2txt for document processing
- Tailwind CSS for beautiful styling
- Lucide for beautiful icons

## 📧 Support

For support, please open an issue on GitHub or contact us at support@example.com

## 🗺️ Roadmap

- [ ] Add support for more document formats (.txt, .csv, .xlsx)
- [ ] Implement document preview
- [ ] Add user authentication
- [ ] Cloud deployment guides (AWS, GCP, Azure)
- [ ] Docker containerization
- [ ] Advanced RAG with vector databases
- [ ] Batch processing support
- [ ] Document version history

---

**Made with ❤️ by DocMind AI Team**
