# Production Dockerfile for Ganpati Booking Backend
FROM python:3.11-slim

# Prevent Python from writing .pyc files & buffer stdout
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies, Chromium for crisp PDF generation, and Devanagari fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-noto-core \
    fonts-noto-extra \
    fonts-deva \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libcairo2 \
    libgdk-pixbuf2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set Chromium path env variable
ENV CHROMIUM_PATH=/usr/bin/chromium

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt boto3==1.34.131

# Copy application source code
COPY . .

# Create directory for uploads
RUN mkdir -p static/uploads/photos static/uploads/pdfs static/fonts

EXPOSE 8000

# Run with production Uvicorn settings
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
