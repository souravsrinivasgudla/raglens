import base64
from datetime import datetime
import json
import os
import re
import requests
import shutil
import tempfile
import traceback
from typing import Dict, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from starlette.middleware.base import BaseHTTPMiddleware

# Langchain and AI
from groq import Groq
from langchain_chroma import Chroma
from langchain_community.document_loaders import PyPDFLoader
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()


class CatchExceptionsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        try:
            return await call_next(request)
        except Exception as exc:
            return JSONResponse(
                {"detail": str(exc), "trace": traceback.format_exc()}, status_code=500)


app = FastAPI(title="RAG Pipeline API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure images directory exists and mount it
os.makedirs("generated_images", exist_ok=True)
app.mount("/images", StaticFiles(directory="generated_images"), name="images")

app.add_middleware(CatchExceptionsMiddleware)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
HF_TOKEN = os.getenv("HF_TOKEN")
CHROMA_PERSIST_DIR = "./chroma_db"

if not GROQ_API_KEY or GROQ_API_KEY == "your_groq_api_key_here":
    print("WARNING: GROQ_API_KEY is not set correctly in .env")

# Global clients
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

vectorstore: Optional[Chroma] = None
# stores page text lines for line-number lookup
pdf_metadata: Dict[int, str] = {}


class QueryRequest(BaseModel):
    question: str


class QueryResponse(BaseModel):
    answer: str
    page_number: Optional[int]
    line_number: Optional[int]
    context_snippet: Optional[str]
    matched: bool


class ImageRequest(BaseModel):
    prompt: str
    style: str = "Technical Architecture Diagram"
    theme: str = "Professional"
    color: str = "Vibrant"


def find_line_number(page_text: str, chunk_text: str) -> int:
    """Find the starting line number of a chunk within a page."""
    # 1. Try exact exact index match first
    index = page_text.find(chunk_text[:100])  # type: ignore
    if index != -1:
        return page_text.count("\n", 0, index) + 1

    # 2. Try to find approximate position using regex by ignoring whitespace
    # differences
    clean_chunk = chunk_text.strip()
    if not clean_chunk:
        return 1

    # Take the first ~60 characters for searching
    search_prefix = clean_chunk[:60]  # type: ignore

    # Split by whitespace, escape each word, then join with \s+
    words = search_prefix.split()
    if not words:
        return 1

    # Create regex pattern: word1\s+word2\s+word3...
    pattern_str = r'\s+'.join(re.escape(word) for word in words)

    match = re.search(pattern_str, page_text, re.IGNORECASE)
    if match:
        # Count newlines in page_text up to the start of the match
        return page_text.count('\n', 0, match.start()) + 1

    return 1


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    global vectorstore, pdf_metadata
    tmp_path = None
    try:
        if not file.filename.endswith(".pdf"):
            raise HTTPException(
                status_code=400,
                detail="Only PDF files are supported.")

        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
        # Load PDF with page metadata
        loader = PyPDFLoader(tmp_path)
        pages = loader.load()

        # Store page content for line-number lookup
        pdf_metadata = {
            i + 1: page.page_content for i,
            page in enumerate(pages)}

        # Split into chunks while preserving page metadata
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50,
            separators=["\n\n", "\n", ".", " "]
        )
        chunks = splitter.split_documents(pages)

        # Enrich chunks with page number in metadata
        for chunk in chunks:
            chunk.metadata["page_number"] = chunk.metadata.get("page", 0) + 1

        # Clear old vectorstore and create new one
        if os.path.exists(CHROMA_PERSIST_DIR):
            if vectorstore is not None:
                try:
                    vectorstore.delete_collection()
                except Exception:
                    pass
            try:
                import chromadb
                chromadb.api.client.SharedSystemClient.clear_system_cache()
            except Exception:
                pass
            vectorstore = None

            # Additional safety: try to rmtree
            try:
                shutil.rmtree(CHROMA_PERSIST_DIR)
            except Exception as e:
                print(f"Warning: could not delete {CHROMA_PERSIST_DIR}: {e}")

        vectorstore = Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
            persist_directory=CHROMA_PERSIST_DIR
        )

        return {
            "message": "PDF uploaded and indexed successfully.",
            "pages": len(pages),
            "chunks": len(chunks),
            "filename": file.filename
        }

    except Exception as e:
        import traceback
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=500,
            content={
                "detail": str(e),
                "trace": traceback.format_exc()})

    finally:
        if tmp_path is not None:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass


@app.post("/query", response_model=QueryResponse)
async def query_pdf(req: QueryRequest):
    if vectorstore is None:
        raise HTTPException(status_code=400, detail="No PDF uploaded yet.")

    # Semantic search — retrieve top 4 most relevant chunks
    results = vectorstore.similarity_search_with_score(req.question, k=4)

    SIMILARITY_THRESHOLD = 1.2  # Lower = more similar (L2 distance)

    if not results or results[0][1] > SIMILARITY_THRESHOLD:
        return QueryResponse.model_validate({
            "answer": "I'm sorry, I couldn't find relevant information in the uploaded PDF to answer your question.",
            "page_number": None,
            "line_number": None,
            "context_snippet": None,
            "matched": False
        })

    # Use top match for page/line reference
    best_doc, best_score = results[0]
    page_num = best_doc.metadata.get("page_number", 1)
    chunk_text = best_doc.page_content

    # Find line number within the page
    page_content = pdf_metadata.get(page_num, "")

    # Build context from all retrieved chunks
    context = "\n\n---\n\n".join([doc.page_content for doc, _ in results])

    # Use Groq to generate a fluent answer from retrieved context
    prompt = f"""You are a document-based QA assistant.

Rules:
1. Answer ONLY using the provided context.
2. Do NOT hallucinate or add external knowledge.
3. If the answer is clearly present, ALWAYS answer.
4. Do NOT say "Not found" if partial or indirect information exists.
5. Only say "Not found in the document" if absolutely no relevant information exists.
6. Combine information from multiple context chunks if needed.
7. Use exact terms from the document.
8. Provide a clear, complete answer in 2–3 sentences.
9. Include ALL relevant page numbers.
10. Output your response in valid JSON format with exactly two keys:
    - "answer": Your clear, complete answer.
    - "exact_quote": The exact sentence or phrase from the Context that directly answers the question.

Context:
{context}

Question:
{req.question}
"""

    if not groq_client:
        raise HTTPException(
            status_code=500,
            detail="Groq client not initialized. Check GROQ_API_KEY.")

    completion = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=500,
        response_format={"type": "json_object"}
    )

    raw_response = completion.choices[0].message.content.strip()
    try:
        data = json.loads(raw_response)
        answer = data.get("answer", raw_response)
        quote = data.get("exact_quote", chunk_text)
        if not quote:  # Fallback if LLM returns empty quote
            quote = chunk_text
    except Exception:
        answer = raw_response
        quote = chunk_text

    line_num = find_line_number(page_content, quote)

    return QueryResponse.model_validate({
        "answer": answer,
        "page_number": page_num,
        "line_number": line_num,
        "context_snippet": chunk_text[:300] + "..." if len(chunk_text) > 300 else chunk_text,
        "matched": True
    })


@app.post("/generate-image")
async def generate_image(req: ImageRequest):
    if not HF_TOKEN:
        raise HTTPException(status_code=400,
                            detail="Hugging Face token not configured.")
    try:
        # Context extraction for informed prompt generation
        context = ""
        if vectorstore is not None:
            results = vectorstore.similarity_search(req.prompt, k=3)
            context = "\n".join([doc.page_content for doc in results])

        # Use Groq to generate a descriptive, simplified visual prompt
        if groq_client:
            sys_msg = (
                f"You are an expert technical illustrator specializing in {req.style}. "
                f"Convert the user's concept into a {req.style} with a {req.theme} theme and {req.color} color palette. "
                "Use clean, professional components and connections. The goal is to visualize the "
                "entire concept's structure and relationships in a single, well-organized pictorial diagram in landscape orientation. "
                "Focus on clarity and educational value. Ensure a wide 16:9 aspect ratio layout."
            )
            prompt = f"Concept: {
                req.prompt}\n\nContext from document: {context}" if context else f"Concept: {
                req.prompt}"

            completion = groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": sys_msg},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=300
            )
            visual_prompt = completion.choices[0].message.content.strip()
            print(f"Generated Visual Prompt: {visual_prompt}")
        else:
            visual_prompt = f"{
                req.style}, {
                req.theme} theme, {
                req.color} colors. {
                req.prompt}"

        # New Hugging Face router endpoint for FLUX
        API_URL = "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell"
        headers = {"Authorization": f"Bearer {HF_TOKEN}"}

        response = requests.post(
            API_URL, headers=headers, json={
                "inputs": visual_prompt}, timeout=90)

        if response.status_code != 200:
            raise Exception(f"HF API Error: {response.text}")

        image_content = response.content

        # Save the generated image
        os.makedirs("generated_images", exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"gen_{timestamp}.png"
        filepath = os.path.join("generated_images", filename)
        with open(filepath, "wb") as f:
            f.write(image_content)
        print(f"Image saved to: {filepath}")

        img_str = base64.b64encode(image_content).decode()
        return {
            "image": f"data:image/png;base64,{img_str}",
            "filename": filename
        }

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok", "vectorstore_loaded": vectorstore is not None}


@app.get("/list-images")
async def list_images():
    try:
        os.makedirs("generated_images", exist_ok=True)
        files = [f for f in os.listdir(
            "generated_images") if f.endswith(".png")]
        # Sort by creation time, newest first
        files.sort(
            key=lambda x: os.path.getctime(
                os.path.join(
                    "generated_images",
                    x)),
            reverse=True)
        return {"images": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/delete-image/{filename}")
async def delete_image(filename: str):
    try:
        print(f"Delete request received for: {filename}")
        print(f"Current working directory: {os.getcwd()}")
        # Security: only allow deleting .png files from generated_images
        if not filename.endswith(
                ".png") or ".." in filename or "/" in filename or "\\" in filename:
            raise HTTPException(status_code=400, detail="Invalid filename.")

        filepath = os.path.join("generated_images", filename)
        abs_filepath = os.path.abspath(filepath)
        print(f"Targeting file at: {abs_filepath}")

        if os.path.exists(filepath):
            os.remove(filepath)
            print(f"Successfully deleted: {abs_filepath}")
            return {"message": f"Deleted {filename}"}
        else:
            print(f"File NOT found at: {abs_filepath}")
            raise HTTPException(status_code=404, detail="Image not found.")
    except Exception as e:
        print(f"Delete error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
