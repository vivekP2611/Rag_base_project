from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
import docx2txt

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/extract")
async def extract_text(file: UploadFile = File(...)):
    content = await file.read()
    
    if file.filename.endswith('.pdf'):
        text = extract_pdf(content)
    elif file.filename.endswith('.docx'):
        text = extract_docx(content)
    else:
        return {"error": "Unsupported file type"}
    
    # Chunk the text into overlapping slices for downstream search
    chunks = split_text(text, chunk_size=1000, chunk_overlap=200)
    
    return {
        "text": text,
        "chunks": [{"text": chunk, "index": i} for i, chunk in enumerate(chunks)]
    }


def split_text(text, chunk_size=1000, chunk_overlap=200):
    text = text.replace('\r\n', '\n')
    chunks = []
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

def extract_pdf(content):
    import io
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        return "\n".join([page.extract_text() or "" for page in pdf.pages])

def extract_docx(content):
    import io
    return docx2txt.process(io.BytesIO(content))

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend_app:app", host="0.0.0.0", port=port, reload=True)