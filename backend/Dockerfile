# -------- BASE IMAGE --------
FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Copy requirements first (for caching)
COPY requirements.txt .

# Install system deps (only if needed)
RUN apt-get update && apt-get install -y build-essential \
    && rm -rf /var/lib/apt/lists/*


# Install dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

RUN apt-get purge -y build-essential

# Copy app
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]