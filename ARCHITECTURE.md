# DocMind AI - System Architecture & Setup

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js: localhost:3000)           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐  │
│  │  Upload Zone     │  │  Chat Sidebar    │  │  Summary    │  │
│  │  - Drag & Drop   │  │  - Messages      │  │  - Overview │  │
│  │  - File Preview  │  │  - Input Field   │  │  - Key Pts  │  │
│  └────────┬─────────┘  └────────┬─────────┘  └─────────────┘  │
│           │                     │                               │
│           └─────────────────────┼───────────────────────────────┤
│                                 │                               │
│         ┌───────────────────────┴────────────────────┐          │
│         │          API Routes (TypeScript)          │          │
│         ├───────────────────────────────────────────┤          │
│         │ • /api/extract   → File upload handler   │          │
│         │ • /api/embed     → Vector embedding      │          │
│         │ • /api/chat      → Q&A proxy             │          │
│         │ • /api/summarize → Summary generation    │          │
│         └───────────────┬──────────────────────────┘          │
│                         │                                      │
└─────────────────────────┼──────────────────────────────────────┘
                          │ HTTP
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND (FastAPI: localhost:8001)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           FastAPI Application (Python)                  │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                          │  │
│  │  POST /extract                                          │  │
│  │  ├─ Accept PDF/DOCX upload                            │  │
│  │  ├─ Extract text using pdfplumber + mammoth           │  │
│  │  ├─ Chunk text (1000 chars, 200 char overlap)        │  │
│  │  └─ Return: {text, chunks}                           │  │
│  │                                                          │  │
│  │  POST /embed (TO BE ADDED)                             │  │
│  │  ├─ Receive text chunks                              │  │
│  │  ├─ Call OpenAI Embeddings API                       │  │
│  │  ├─ Store vectors in ChromaDB                        │  │
│  │  └─ Return: document_id                              │  │
│  │                                                          │  │
│  │  POST /query (TO BE ADDED)                            │  │
│  │  ├─ Receive user question                            │  │
│  │  ├─ Search Chroma for similar chunks (RAG)           │  │
│  │  ├─ Pass context to GPT + question                   │  │
│  │  └─ Return: AI-generated answer                      │  │
│  │                                                          │  │
│  │  POST /summarize (TO BE ADDED)                        │  │
│  │  ├─ Get all document chunks                          │  │
│  │  ├─ Call GPT (chain-of-thought)                      │  │
│  │  └─ Return: summary + key_points                     │  │
│  │                                                          │  │
│  └──────────┬───────────────────────────────┬──────────────┘  │
│             │                               │                 │
│             ▼                               ▼                 │
│  ┌──────────────────────┐      ┌──────────────────────┐       │
│  │   ChromaDB (Local)   │      │  OpenAI API         │       │
│  │                      │      │  - Embeddings       │       │
│  │  Vector Store        │      │  - GPT-4            │       │
│  │  - Document chunks   │      │  - Text completion  │       │
│  │  - Embeddings        │      │                     │       │
│  │  - Similarity search │      │  ⚠️ Requires API key│       │
│  └──────────────────────┘      └──────────────────────┘       │
│             │                                                  │
│  ┌──────────▼─────────────────────────────────────────────┐   │
│  │         Local Storage (./chroma_data/)                │   │
│  │         - Document vectors                           │   │
│  │         - Metadata                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                                │
└─────────────────────────────────────────────────────────────────┘


DATA FLOW EXAMPLE:

1) USER UPLOADS PDF
   User → UploadZone component
     ↓
   Drag & drop file
     ↓
   POST /api/extract
     ↓
   FastAPI /extract endpoint
     ↓
   Extract text with pdfplumber
     ↓
   Return chunks to frontend
     ↓
   Display in SummaryDisplay

2) USER ASKS QUESTION (RAG FLOW)
   User → ChatSidebar input
     ↓
   Type question & send
     ↓
   POST /api/chat { message, documentId }
     ↓
   FastAPI /query endpoint
     ↓
   Search ChromaDB for similar chunks
     ↓
   Build prompt: "Context: [chunks] Question: [user msg]"
     ↓
   Call OpenAI GPT-4
     ↓
   Return AI answer
     ↓
   Display in chat bubble
```

---

## File Structure

```
rag-document-ai/
├── next-monorepo/
│   ├── apps/web/
│   │   ├── app/
│   │   │   ├── page.tsx                    ✅ Main dashboard
│   │   │   ├── api/
│   │   │   │   ├── extract/route.ts        ✅ File upload handler
│   │   │   │   ├── chat/route.ts           ❌ TO BUILD
│   │   │   │   ├── embed/route.ts          ❌ TO BUILD
│   │   │   │   └── summarize/route.ts      ❌ TO BUILD
│   │   │   └── layout.tsx                  ✅ Root layout
│   │   ├── components/
│   │   │   ├── UploadZone.tsx              ✅ Drag-drop upload
│   │   │   ├── ChatSidebar.tsx             ✅ Chat interface
│   │   │   └── SummaryDisplay.tsx          ✅ Summary section
│   │   └── lib/
│   │       ├── types.ts                    ✅ TypeScript types
│   │       ├── documentProcessing.ts       ✅ Text chunking
│   │       ├── rag-pipeline.ts             ❌ TO BUILD
│   │       └── chromadb-client.ts          ❌ TO BUILD
│   │
│   └── package.json
│
├── backend_app.py                           ✅ FastAPI server
├── NEXT_STEPS.md                            ✅ This file
└── .env.local                               ❌ CREATE THIS

```

---

## Current Status

### ✅ COMPLETED
- Next.js frontend with professional UI
- File upload endpoint
- PDF & DOCX text extraction
- Text chunking algorithm
- Database typing system
- Chat interface (UI only)
- Summary display (UI only)

### ❌ TODO (Priority Order)

**This Week (Phase 1):**
1. ChromaDB vector store setup
2. OpenAI embeddings integration
3. Document embedding pipeline
4. Basic Q&A endpoint

**Next Week (Phase 2):**
5. Advanced RAG retrieval
6. Auto-summarization
7. Conversation memory
8. Document persistence

**Later (Polish):**
9. Error handling
10. Performance optimization
11. Security hardening
12. Deployment setup

---

## Running the Full Stack

### Terminal 1: Backend
```bash
cd C:\Users\91812\OneDrive\Desktop\Rag_base_project
.\.venv\Scripts\python.exe backend_app.py
# Running on http://localhost:8001
```

### Terminal 2: Frontend
```bash
cd C:\Users\91812\OneDrive\Desktop\Rag_base_project\rag-document-ai\next-monorepo
npx turbo dev
# Available at http://localhost:3000
```

### Test the Flow
1. Open http://localhost:3000
2. Upload a PDF or Word document
3. See it extracted and analyzed
4. Ask questions in chat (currently mock responses)
5. View auto-generated summary

---

## Cost Estimates (OpenAI)

| Task | Cost per request | Monthly (1000 requests) |
|------|-----------------|------------------------|
| Embed document (1000 tokens) | ~$0.0002 | ~$0.20 |
| Answer question (GPT-4 Turbo) | ~$0.05 | ~$50 |
| Generate summary (GPT-4) | ~$0.03 | ~$30 |
| **Total monthly** | | **~$80** |

**Cost Optimization:**
- Use GPT-3.5 instead of GPT-4: -70% cost
- Cache summaries: -50% repeat requests
- Batch embeddings: -20% API calls

---

## Getting Started with RAG

### Step 1: Get API Keys
```bash
# OpenAI
https://platform.openai.com/api-keys
# Create key and add to .env

# Optional: Pinecone (for scaling)
https://pinecone.io/
```

### Step 2: Install RAG Dependencies
```bash
cd backend
pip install chromadb langchain-chroma langchain-openai
```

### Step 3: Build Embedding Pipeline
```python
# In backend_app.py
from chromadb.config import Settings
from langchain_openai import OpenAIEmbeddings

# Initialize embedder
embedder = OpenAIEmbeddings(model="text-embedding-3-small")
```

### Step 4: Store & Retrieve
```python
# Store chunks
chunks_with_ids = [(chunk.id, chunk.text) for chunk in chunks]
embeddings = embedder.embed_documents([c[1] for c in chunks_with_ids])

# Retrieve similar chunks for RAG
query_embedding = embedder.embed_query(user_question)
similar_chunks = chroma.similarity_search_by_vector(query_embedding)
```

### Step 5: Call LLM with Context
```python
# Build RAG prompt
context = "\n".join([chunk.text for chunk in similar_chunks])
rag_prompt = f"""
Context from document:
{context}

Question: {user_question}

Answer based only on the context above:
"""

response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[{"role": "user", "content": rag_prompt}]
)
```

---

## Performance Goals

- Upload → Extract: < 2 seconds
- Question → Answer: < 3 seconds
- Summary generation: < 5 seconds
- Chat response: < 2 seconds

---

**Start building Phase 1 today! Questions? Check out NEXT_STEPS.md** 🚀
