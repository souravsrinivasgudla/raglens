# -------- STAGE 1: BUILDER --------
FROM python:3.12-slim AS builder

WORKDIR /app

# Install build tools (only for building deps)
RUN apt-get update && apt-get install -y build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# 🔥 Install CPU-only torch FIRST (prevents GPU bloat)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir --user -r requirements.txt

# -------- STAGE 2: FINAL --------
FROM python:3.12-slim

WORKDIR /app

ENV PATH=/root/.local/bin:$PATH
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Copy only installed Python packages
COPY --from=builder /root/.local /root/.local

# 🔥 Remove any accidental GPU leftovers (safety cleanup)
RUN rm -rf /root/.local/lib/python3.12/site-packages/nvidia* || true

# Copy application code
COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]