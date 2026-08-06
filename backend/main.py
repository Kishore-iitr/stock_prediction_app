import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import time
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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

@app.get("/")
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
