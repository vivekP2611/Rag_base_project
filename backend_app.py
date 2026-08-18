"""
RAG Backend — HuggingFace Embeddings + ChromaDB + Groq Llama 3.1
"""

from __future__ import annotations

import io
import os
import re
import logging
import uuid
from typing import List, Optional

import dotenv
dotenv.load_dotenv(".env.local")
dotenv.load_dotenv()

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ─── Lazy singletons ────────────────────────────────────────────────────────
_embedder = None
_chroma_client = None
chat_history = {}

def get_embedder():
    global _embedder
    if _embedder is None:
        logging.info("Loading sentence-transformer model (first time may take ~30s)…")
        from sentence_transformers import SentenceTransformer
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
        logging.info("Model loaded.")
    return _embedder

def get_chroma():
    global _chroma_client
    if _chroma_client is None:
        import chromadb
        _chroma_client = chromadb.EphemeralClient()
    return _chroma_client

# ─── FastAPI setup ───────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
app = FastAPI(title="DocMind RAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def warmup():
    """Pre-load the embedding model so the first upload is instant."""
    import asyncio
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, get_embedder)
    logging.info("Embedding model pre-loaded and ready.")


# ─── Pydantic models ─────────────────────────────────────────────────────────
class SummarizeRequest(BaseModel):
    session_id: str
    text: str          # first 6000 chars of document for summarization

class ChatRequest(BaseModel):
    session_id: str
    question: str


# ─── Text helpers ────────────────────────────────────────────────────────────
def clean_text(text: str) -> str:
    text = re.sub(r"\(cid:\d+\)", " ", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def split_text(text: str, chunk_size: int = 800, chunk_overlap: int = 150) -> List[str]:
    text = text.replace("\r\n", "\n")
    chunks: List[str] = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == len(text):
            break
        start += chunk_size - chunk_overlap
    return chunks


# ─── PDF / DOCX extraction ───────────────────────────────────────────────────
def extract_pdf(content: bytes) -> str:
    import pdfplumber
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        return "\n".join(page.extract_text() or "" for page in pdf.pages)


def extract_docx(content: bytes) -> str:
    import docx2txt
    return docx2txt.process(io.BytesIO(content))


# ─── Groq helper ─────────────────────────────────────────────────────────────
def groq_client():
    from groq import Groq
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY not set in .env.local")
    return Groq(api_key=api_key)


def call_groq(system: str, user: str, max_tokens: int = 1024) -> str:
    client = groq_client()
    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.3,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content.strip()

def call_groq_chat_history(system: str, history: List[dict], max_tokens: int = 1024) -> str:
    client = groq_client()
    messages = [{"role": "system", "content": system}] + history
    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=messages,
        temperature=0.3,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content.strip()


# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.post("/extract")
async def extract(file: UploadFile = File(...)):
    """
    1. Extract text from PDF/DOCX
    2. Chunk the text
    3. Embed with sentence-transformers
    4. Store embeddings in ChromaDB under a unique session_id
    Returns session_id + text + chunk count
    """
    content = await file.read()

    filename = file.filename or ""
    if filename.lower().endswith(".pdf"):
        raw = extract_pdf(content)
    elif filename.lower().endswith(".docx"):
        raw = extract_docx(content)
    else:
        return {"error": "Unsupported file type. Please upload PDF or DOCX."}

    text = clean_text(raw)
    if not text.strip():
        return {"error": "Could not extract any text from the document."}

    chunks = split_text(text)
    if not chunks:
        return {"error": "Document appears to be empty after processing."}

    # Embed all chunks
    embedder = get_embedder()
    embeddings = embedder.encode(chunks, show_progress_bar=False).tolist()

    # Store in ChromaDB
    session_id = str(uuid.uuid4())
    chroma = get_chroma()

    # Delete collection if it already exists (shouldn't, but just in case)
    try:
        chroma.delete_collection(session_id)
    except Exception:
        pass

    collection = chroma.create_collection(
        name=session_id,
        metadata={"hnsw:space": "cosine"},
    )

    ids = [f"chunk_{i}" for i in range(len(chunks))]
    collection.add(
        ids=ids,
        documents=chunks,
        embeddings=embeddings,
        metadatas=[{"index": i} for i in range(len(chunks))],
    )

    logging.info(f"Session {session_id}: embedded {len(chunks)} chunks")

    return {
        "session_id": session_id,
        "text": text,
        "chunk_count": len(chunks),
        # send first 6000 chars for summarization
        "text_preview": text[:6000],
    }


@app.post("/summarize")
async def summarize(req: SummarizeRequest):
    """
    Use Groq Llama to generate:
    - overview: 3-4 sentence paragraph about the document
    - key_points: 5 bullet-point takeaways
    """
    system_prompt = (
        "You are a professional document analyst. "
        "Read the provided document excerpt and produce two things:\n"
        "1. A concise OVERVIEW paragraph (3-4 sentences) explaining what the document is about.\n"
        "2. Exactly 5 KEY POINTS as short bullet points (start each with '-').\n\n"
        "Respond in this exact format:\n"
        "OVERVIEW:\n<your overview here>\n\n"
        "KEY_POINTS:\n- point 1\n- point 2\n- point 3\n- point 4\n- point 5"
    )

    user_prompt = f"Document excerpt:\n\n{req.text[:5000]}"

    try:
        raw = call_groq(system_prompt, user_prompt, max_tokens=600)

        # Parse the structured response
        overview = ""
        key_points: List[str] = []

        if "OVERVIEW:" in raw and "KEY_POINTS:" in raw:
            parts = raw.split("KEY_POINTS:")
            overview_part = parts[0].replace("OVERVIEW:", "").strip()
            kp_part = parts[1].strip() if len(parts) > 1 else ""

            overview = overview_part.strip()
            key_points = [
                line.lstrip("-• ").strip()
                for line in kp_part.split("\n")
                if line.strip().startswith(("-", "•", "*"))
            ]
        else:
            # Fallback: return the whole thing as overview
            overview = raw[:800]
            key_points = []

        return {"overview": overview, "key_points": key_points}

    except Exception as e:
        logging.error(f"Summarize error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
async def chat(req: ChatRequest):
    """
    1. Embed the user question
    2. Query ChromaDB for top-5 relevant chunks
    3. Send context + question to Groq Llama
    4. Return the answer
    """
    chroma = get_chroma()

    # Try to get the collection
    try:
        collection = chroma.get_collection(req.session_id)
    except Exception:
        raise HTTPException(
            status_code=404,
            detail="Session not found. Please re-upload your document.",
        )

    # Embed the question
    embedder = get_embedder()
    question_embedding = embedder.encode([req.question], show_progress_bar=False).tolist()[0]

    # Retrieve top-5 relevant chunks
    results = collection.query(
        query_embeddings=[question_embedding],
        n_results=min(5, collection.count()),
    )

    retrieved_chunks: List[str] = results["documents"][0] if results["documents"] else []

    if not retrieved_chunks:
        return {"answer": "I couldn't find relevant information in the document to answer your question."}

    context = "\n\n---\n\n".join(retrieved_chunks)

    system_prompt = (
        "You are DocMind, an expert AI document assistant. "
        "Answer the user's question using ONLY the provided document context. "
        "Be accurate, detailed, and conversational. "
        "If the context doesn't contain enough information, say so honestly. "
        "Never make up facts. Use markdown formatting where helpful (bold, lists, etc.).\n\n"
        f"Document Context:\n\n{context}"
    )

    # Initialize chat history for session if not exists
    if req.session_id not in chat_history:
        chat_history[req.session_id] = []
        
    chat_history[req.session_id].append({"role": "user", "content": req.question})

    try:
        answer = call_groq_chat_history(system_prompt, chat_history[req.session_id], max_tokens=1024)
        chat_history[req.session_id].append({"role": "assistant", "content": answer})
        return {"answer": answer}
    except Exception as e:
        logging.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok", "model": "all-MiniLM-L6-v2", "llm": "openai/gpt-oss-120b"}


# ─── Entry point ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend_app:app", host="0.0.0.0", port=port, reload=True)