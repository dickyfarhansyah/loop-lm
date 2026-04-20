FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (for PyMuPDF/fitz and other native libs)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libffi-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (for layer caching)
COPY apps/backend-python/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY apps/backend-python/ .

# Create upload and data directories
RUN mkdir -p /app/uploads /app/data/chroma

EXPOSE 8031

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8031/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8031"]
