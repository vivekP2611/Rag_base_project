# DocMind AI 🧠✨

**Intelligent RAG-powered Document Assistant — Upload, Analyze, and Chat with your Documents**

DocMind AI is a full-stack Retrieval-Augmented Generation (RAG) application. Upload a PDF or DOCX, get an AI-generated executive summary and key highlights, then chat with the document using natural language — all in a stunning glassmorphic dark-mode UI.

[![License: MIT](https://img.shields.io/badge/License-MIT-indigo.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.9%2B-blue)](https://python.org)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688)](https://fastapi.tiangolo.com)

---

## ✨ Features

| Feature | Description |
|---|---|
| 📄 **Drag & Drop Upload** | Upload PDF or DOCX files instantly, up to 10 MB |
| 🧠 **Vector Embeddings** | Text is chunked and embedded using `all-MiniLM-L6-v2` via sentence-transformers |
| 🗄️ **ChromaDB Vector Store** | All chunks are stored in an ephemeral ChromaDB instance for similarity search |
| ⚡ **AI Summarization** | Groq Llama generates a 3-4 sentence overview and 5 key bullet points |
| 💬 **RAG-powered Chat** | Ask any question — top-5 semantically relevant chunks are retrieved and sent to Groq for context-aware answers |
| 🎯 **Suggested Inquiries** | One-click question starters that auto-send to the chatbot |
| 📊 **3-Column Layout** | After upload: doc info + suggestions | full-height summary | full-height chat |
| 📥 **Export Report** | Download an HTML summary report of the document |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Browser (Next.js 16)                   │
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────┐  │
│  │  Doc Info +  │  │   Executive    │  │  DocMind AI │  │
│  │  Suggestions │  │    Summary     │  │    Chat     │  │
│  └──────────────┘  └────────────────┘  └─────────────┘  │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP (REST)
┌──────────────────────────▼──────────────────────────────┐
│              FastAPI Backend (port 8000)                  │
│                                                           │
│  POST /extract  →  Parse PDF/DOCX  →  Chunk  →  Embed    │
│                    (pdfplumber / docx2txt)  (MiniLM)      │
│                         │                    │            │
│                         ▼                    ▼            │
│                    ChromaDB (ephemeral vector store)      │
│                                                           │
│  POST /summarize →  Groq Llama (overview + key points)   │
│  POST /chat      →  VecSearch → Retrieved Chunks → Groq  │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend
| Package | Purpose |
|---|---|
| **FastAPI** + Uvicorn | REST API server with hot-reload |
| **pdfplumber** | High-accuracy PDF text extraction |
| **docx2txt** | DOCX text extraction |
| **sentence-transformers** (`all-MiniLM-L6-v2`) | Local embedding model (no API key needed) |
| **ChromaDB** | In-memory vector store for chunk retrieval |
| **Groq** (`groq` SDK) | LLM inference via `openai/gpt-oss-120b` |
| **python-dotenv** | Environment variable management |

### Frontend
| Package | Purpose |
|---|---|
| **Next.js 16** (App Router) | React framework |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Utility-first styling with dark mode & glassmorphism |
| **Turborepo** | Monorepo tooling |
| **Lucide React** | Icon system |
| **axios** | HTTP client |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 20+
- A free **[Groq API key](https://console.groq.com/)** (for summarization and chat)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/rag-document-ai.git
cd rag-document-ai
```

### 2. Backend Setup

```bash
# Create and activate virtual environment (recommended)
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS / Linux

# Install Python dependencies
pip install -r requirements.txt

# Create environment file
echo GROQ_API_KEY=your_groq_api_key_here > .env.local
echo BACKEND_HOST=0.0.0.0 >> .env.local
echo BACKEND_PORT=8000 >> .env.local

# Start backend
python backend_app.py
```

> Backend runs at **http://localhost:8000** — API docs at **http://localhost:8000/docs**

### 3. Frontend Setup

```bash
# Navigate to frontend monorepo
cd rag-document-ai/next-monorepo

# Install dependencies
npm install --legacy-peer-deps

# Create environment file
echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env.local

# Start development server
npm run dev
```

> Frontend runs at **http://localhost:3000**

---

## 📁 Project Structure

```
rag-document-ai/
├── backend_app.py            # FastAPI server — extract, embed, summarize, chat
├── requirements.txt          # Python dependencies
├── .env.local                # Backend environment (GROQ_API_KEY, PORT)
├── .venv/                    # Python virtual environment
│
└── rag-document-ai/
    └── next-monorepo/
        ├── apps/
        │   └── web/
        │       ├── app/
        │       │   ├── page.tsx          # Main page — 3-column layout
        │       │   └── api/
        │       │       ├── extract/      # Proxies to backend /extract
        │       │       ├── summarize/    # Proxies to backend /summarize
        │       │       └── chat/         # Proxies to backend /chat
        │       └── components/
        │           ├── ChatSidebar.tsx   # RAG chat with triggerQuestion support
        │           ├── SummaryDisplay.tsx# Overview + key points + export report
        │           └── UploadZone.tsx    # Drag-and-drop upload
        ├── packages/                     # Shared ESLint & TypeScript configs
        └── turbo.json                    # Turborepo pipeline config
```

---

## 🔑 Environment Variables

### Backend (`.env.local` in project root)

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | ✅ Yes | Groq API key — get free at [console.groq.com](https://console.groq.com) |
| `BACKEND_HOST` | Optional | Host to bind (default: `0.0.0.0`) |
| `BACKEND_PORT` | Optional | Port to bind (default: `8000`) |

### Frontend (`rag-document-ai/next-monorepo/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ Yes | URL of the backend API (e.g. `http://localhost:8000`) |

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/extract` | Upload PDF/DOCX → returns `session_id`, extracted text, chunk count |
| `POST` | `/summarize` | Send `session_id` + text → returns `overview` and `key_points` |
| `POST` | `/chat` | Send `session_id` + `question` → returns RAG-based `answer` |
| `GET` | `/health` | Health check — returns model info |

Full interactive docs at `http://localhost:8000/docs` (Swagger UI).

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please follow [conventional commits](https://www.conventionalcommits.org/) for commit messages.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

*Built with ❤️ using FastAPI, Next.js, ChromaDB, sentence-transformers, and Groq.*
