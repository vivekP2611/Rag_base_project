# DocMind AI

DocMind AI is a smart document intelligence application that enables users to upload PDF and DOCX files, extract useful information, summarize document content, and ask questions about the document in natural language. The system combines document parsing, embedding-based retrieval, and large language model reasoning to create a practical Retrieval-Augmented Generation (RAG) workflow for local document analysis.

This project is designed to make document understanding faster, more interactive, and more accessible. Instead of manually reading long files, users can upload a document, generate an instant summary, and ask context-aware questions that are answered using the actual content of the document.

---

## Overview

DocMind AI is built as a full-stack application with:

- a Python backend that handles file processing, extraction, embeddings, and AI-powered responses
- a Next.js frontend that provides the user interface for file upload, summary generation, and chat
- a vector database for semantic retrieval of document chunks
- a Groq-powered language model for summarization and conversational Q&A

The core idea is to convert unstructured content into structured, searchable knowledge and then use that knowledge to answer questions accurately and relevantly.

---

## Why This Project

Modern businesses and developers often work with large PDF and document files that contain critical information but are difficult to search quickly. Traditional keyword-based search is limited, and manually reading long documents is time-consuming.

DocMind AI solves this by combining:

- document parsing for extracting text from PDFs and DOCX files
- chunking for breaking large documents into smaller meaningful segments
- embeddings for semantic similarity search
- retrieval to fetch the most relevant document context
- LLM response generation to answer questions and summarize information

This creates a practical document assistant that feels closer to an intelligent knowledge system than a simple search tool.

---

## Key Features

- Upload PDF and DOCX files
- Extract text content from documents
- Clean and normalize extracted text
- Split text into manageable chunks for better retrieval
- Generate embeddings using sentence-transformers
- Store and query document chunks in ChromaDB
- Summarize the document using Groq LLMs
- Ask natural-language questions grounded in the uploaded document
- Maintain separate document sessions for each uploaded file
- Use a modern web interface for interaction

---

## Technology Stack

### Backend
- Python
- FastAPI
- Uvicorn
- Sentence-Transformers
- ChromaDB
- Groq API
- PDF parsing
- DOCX parsing

### Frontend
- Next.js
- TypeScript
- React
- App Router architecture

### AI / Retrieval Components
- Embedding model: all-MiniLM-L6-v2
- Vector storage: ChromaDB in-memory collection per session
- LLM provider: Groq

---

## System Architecture

The application follows a typical RAG pipeline:

1. User uploads a document.
2. The backend reads the file and extracts text.
3. The text is cleaned and split into smaller chunks.
4. Each chunk is embedded and stored in a vector database.
5. The user asks a question or requests a summary.
6. The system retrieves the most relevant chunks based on similarity.
7. The LLM uses the retrieved chunks as context to answer or summarize.

This architecture keeps responses grounded in document content instead of relying on generic external knowledge alone.

---

## Project Structure

```text
Rag_Base_project/
├── backend_app.py
├── requirements.txt
├── .env.local
├── README.md
├── LICENSE
├── rag-document-ai/
│   └── next-monorepo/
│       ├── apps/
│       │   └── web/
│       ├── packages/
│       ├── package.json
│       ├── turbo.json
│       └── tsconfig.json
└── ...
```

### Main Components

- `backend_app.py` – FastAPI backend with extraction, summary, chat, health, and document retrieval logic
- `requirements.txt` – Python package dependencies
- `.env.local` – local environment variables such as the Groq API key
- `rag-document-ai/next-monorepo` – frontend application for interacting with the backend

---

## Workflow

### 1. Upload a Document
The user selects a PDF or DOCX file from the frontend interface.

### 2. Extract and Clean Text
The backend reads the file and extracts raw textual content.

### 3. Create Chunks
Large documents are split into smaller sections so relevant information can be retrieved efficiently.

### 4. Generate Embeddings
Each chunk is converted into vector embeddings that can be searched semantically.

### 5. Store in Vector Database
The embeddings are stored in ChromaDB under a unique session ID for the uploaded document.

### 6. Summarize or Chat
Once stored, the user can either:

- generate a summary of the document
- ask natural-language questions about the content
- receive answers based on the most relevant chunks

---

## Core API Functionality

The backend exposes a few main API endpoints:

- `/extract` – upload a document, extract its text, generate embeddings, and store them for retrieval
- `/summarize` – generate a high-level summary based on the document content
- `/chat` – answer user questions using document context
- `/health` – check backend health and active model information

These endpoints allow the frontend to communicate with the backend in a modular and scalable way.

---

## Installation

### Prerequisites

Before running the project, make sure you have:

- Python 3.10 or newer
- Node.js and npm
- A Groq API key

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd Rag_Base_project
```

### 2. Create a Virtual Environment

```bash
python -m venv .venv
.venv\Scripts\activate
```

### 3. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env.local` file in the project root and add your Groq key:

```env
GROQ_API_KEY=your_api_key_here
```

This value is required for document summarization and chat responses.

### 5. Install Frontend Dependencies

```bash
cd rag-document-ai\next-monorepo
npm install
```

---

## Running the Application

### Start the Backend

From the project root:

```bash
python backend_app.py
```

This starts the FastAPI backend and loads the embedding model on first run.

### Start the Frontend

From the frontend directory:

```bash
cd rag-document-ai\next-monorepo
npm run dev
```

This starts the Next.js interface for interacting with the project.

---

## How the AI Answers Questions

When a user asks a question, the app performs the following steps:

1. Embeds the user’s question
2. Compares it with stored document chunk embeddings
3. Retrieves the most relevant chunks
4. Builds a context window from those chunks
5. Sends the question and relevant context to the LLM
6. Returns an answer grounded in the document content

This is a strong example of retrieval-augmented generation because the answer is not based solely on the model’s general training; it is anchored to the content actually uploaded by the user.

---

## Benefits of the Project

- Quick document understanding without manual reading
- Retrieval-based Q&A for more factual responses
- Useful for academic, research, and knowledge work
- Good demonstration of AI + document workflows
- Clean separation between backend and frontend
- Easy to extend with more features like multi-document support or authentication

---

## Use Cases

This project can be used for:

- summarizing research papers
- analyzing PDFs for key information
- extracting insights from study material
- searching long internal documents
- building a local knowledge assistant for uploaded files
- demonstrating RAG concepts in a portfolio or interview setting

---

## Challenges and Considerations

Some important considerations for this project include:

- The quality of the answer depends on the quality of the uploaded document
- Very long documents may require more precise chunking strategies
- Embedding-based retrieval is sensitive to query phrasing and document structure
- API rate limits or model availability may affect the LLM response speed
- Local development requires a valid environment configuration and dependencies

---

## Future Improvements

This project can be expanded with many useful features:

- multi-file document support
- persistent storage for uploaded documents
- PDF page citation references in answers
- document history and session management
- user authentication and protected uploads
- database persistence for embeddings and metadata
- deployment to cloud services
- support for more file types beyond PDF and DOCX

---

## Project Goals

DocMind AI demonstrates how modern AI systems can be used to make documents more searchable, understandable, and interactive. It brings together retrieval, embeddings, and language models in a practical real-world workflow that is both educational and useful.

This project is especially well suited for:

- learning RAG architecture
- building AI document assistants
- portfolio and GitHub demonstration projects
- showcasing practical AI application design

---

## License

This project is intended for educational, learning, and demonstration purposes. Please review the repository license before using it in commercial or production settings.

---

## Final Note

DocMind AI is a complete example of an AI-powered document assistant that helps users interact with uploaded files through summarization and conversation. It combines modern backend architecture, retrieval-based search, and LLM-driven reasoning into a clean, explainable application workflow.

Whether you are sharing it on GitHub, using it for learning, or extending it for a production-grade solution, it is a strong example of how AI can transform static documents into interactive knowledge systems.
