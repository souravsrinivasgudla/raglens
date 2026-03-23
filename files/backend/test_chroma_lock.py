import os
import shutil
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document

CHROMA_PERSIST_DIR = "./chroma_db_test"

embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
doc = Document(page_content="Test data", metadata={"page": 1})

# Create DB
vectorstore = Chroma.from_documents([doc], embedding=embeddings, persist_directory=CHROMA_PERSIST_DIR)
print("Created vectorstore")

# Attempt 1: Clear and delete
try:
    vectorstore.delete_collection()
except Exception as e:
    print("Delete collection failed:", e)

try:
    import chromadb
    chromadb.api.client.SharedSystemClient.clear_system_cache()
except Exception as e:
    print("Clear cache failed:", e)

vectorstore = None

try:
    shutil.rmtree(CHROMA_PERSIST_DIR)
    print("Successfully deleted chroma_db folder!")
except Exception as e:
    print("rmtree failed:", type(e), e)
