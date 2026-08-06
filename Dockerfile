# Step 1: Build the Next.js frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Copy package files and install dependencies
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source code and build
COPY frontend/ ./
RUN npm run build

# Step 2: Build the FastAPI backend and serve everything
FROM python:3.10-slim
WORKDIR /app

# Install system dependencies (required for some Python packages like catboost)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code
COPY backend/ ./backend/

# Copy the statically exported Next.js files into the backend's static directory
COPY --from=frontend-builder /app/out /app/backend/static

# Expose the port Railway provides
EXPOSE $PORT

# Start FastAPI server, passing the Railway PORT dynamically
CMD uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}
