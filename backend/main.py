import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import time
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from config import settings
from database import init_db

app = FastAPI(
    title=settings.app_title,
    version="1.0.0",
    description="Production-Grade AI Stock Forecasting and Investment Analysis API with OpenRouter Multi-LLM Fallbacks, yFinance Ingestion, Multi-Model ML Ensembles, and Explainable AI (SHAP)."
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for local dev & production flexibility
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    print(f"[{settings.app_title}] Backend Server Starting Up...")
    await init_db()
    print("Database tables & cache storage initialized successfully.")

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": settings.app_title,
        "timestamp": time.time(),
        "openrouter_models_configured": settings.get_openrouter_models
    }

# Register API routers
from routers import stocks, analysis, news, chat
app.include_router(stocks.router, prefix="/api/stocks", tags=["Stocks"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])
app.include_router(news.router, prefix="/api/news", tags=["News & Sentiment"])
app.include_router(chat.router, prefix="/api/chat", tags=["AI Financial Analyst"])

# Mount static files for Next.js frontend (Monolithic deployment)
frontend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")

if os.path.exists(frontend_path):
    # Mount the _next static assets
    next_assets = os.path.join(frontend_path, "_next")
    if os.path.exists(next_assets):
        app.mount("/_next", StaticFiles(directory=next_assets), name="next-static")
    
    # Catch-all route to serve the frontend SPA
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Ignore API routes just in case
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API route not found")
            
        exact_path = os.path.join(frontend_path, full_path)
        if os.path.exists(exact_path) and os.path.isfile(exact_path):
            return FileResponse(exact_path)
            
        html_path = f"{exact_path}.html"
        if os.path.exists(html_path) and os.path.isfile(html_path):
            return FileResponse(html_path)
            
        index_path = os.path.join(frontend_path, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
            
        raise HTTPException(status_code=404, detail="Frontend route not found")
