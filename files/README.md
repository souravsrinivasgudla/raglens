# RAGlens — PDF RAG Pipeline

A full-stack RAG (Retrieval-Augmented Generation) pipeline that lets you upload a PDF, ask questions about it, and get precise answers with **page number** and **line number** references.

## Architecture

```
Frontend (React + Vite)
       │
       ▼
Backend (FastAPI)
       │
       ├── PDF Loading          → LangChain PyPDFLoader
       ├── Text Chunking        → RecursiveCharacterTextSplitter
       ├── Embeddings           → HuggingFace (all-MiniLM-L6-v2)
       ├── Vector Storage       → ChromaDB
       ├── Semantic Search      → ChromaDB similarity_search
       └── Answer Generation    → Groq API (LLaMA 3)
```

## Prerequisites

- Python 3.10+
- Node.js 18+
- A free [Groq API key](https://console.groq.com)

---

## Setup

### 1. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set your Groq API key
cp .env.example .env
# Edit .env and paste your GROQ_API_KEY

# Run the server
uvicorn main:app --reload --port 8000
```

Backend will be live at: `http://localhost:8000`
API docs at: `http://localhost:8000/docs`

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend will be live at: `http://localhost:3000`

---

## How It Works

### Upload Flow
1. User uploads a PDF via drag-and-drop or file picker
2. FastAPI uses `PyPDFLoader` to extract text page-by-page
3. Text is split into 500-char chunks with 50-char overlap using `RecursiveCharacterTextSplitter`
4. Chunks are embedded with HuggingFace `all-MiniLM-L6-v2` model
5. Embeddings are stored in ChromaDB (persisted to `./chroma_db/`)

### Query Flow
1. User asks a question in the chat interface
2. The question is embedded using the same HuggingFace model
3. ChromaDB performs semantic similarity search (top 4 chunks)
4. If similarity score exceeds threshold → "No match" response
5. If matched → Groq LLaMA 3 synthesizes an answer from the chunks
6. Response includes:
   - ✅ Natural language answer
   - 📄 Page number of best matching chunk
   - ↳ Line number within that page
   - 🔍 Source context snippet (expandable)

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Upload & index a PDF |
| POST | `/query` | Ask a question |
| GET | `/health` | Health check |

### Example Query Request
```json
POST /query
{
  "question": "What is the main conclusion of the paper?"
}
```

### Example Query Response
```json
{
  "answer": "The main conclusion is that transformer models outperform...",
  "page_number": 8,
  "line_number": 14,
  "context_snippet": "In conclusion, our results demonstrate that...",
  "matched": true
}
```

---

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `GROQ_API_KEY` | — | Required. Get from console.groq.com |
| `CHROMA_PERSIST_DIR` | `./chroma_db` | ChromaDB storage path |
| `SIMILARITY_THRESHOLD` | `1.2` | L2 distance cutoff (lower = stricter) |

---

## Customization

- **Swap Groq model**: Change `"llama3-8b-8192"` to `"llama3-70b-8192"` for better quality
- **Adjust chunk size**: Edit `chunk_size=500` in `main.py`
- **Tune similarity**: Lower `SIMILARITY_THRESHOLD` for stricter matching
- **Different embeddings**: Replace `all-MiniLM-L6-v2` with any HuggingFace sentence-transformer
