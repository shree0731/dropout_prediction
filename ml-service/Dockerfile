# Multi-stage production container for FastAPI ML Service
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8001 \
    MODEL_DIR=/app/models

# Install system dependencies (build-essential, libgomp1 for XGBoost OpenMP)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install pinned Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy models artifacts and application code
COPY models /app/models
COPY app /app/app

# Expose internal service port
EXPOSE 8001

# Run uvicorn on $PORT with shell interpolation
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8001}"]
