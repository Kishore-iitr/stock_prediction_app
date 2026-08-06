from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from services.news_service import news_service
from services.sentiment_service import sentiment_service

router = APIRouter()

@router.get("/{ticker}", summary="Get Recent Financial News & OpenRouter Sentiment")
async def get_news_and_sentiment(ticker: str):
    try:
        articles = news_service.fetch_recent_news(ticker)
        sentiment_res = await sentiment_service.analyze_sentiment(ticker, "", articles)
        return sentiment_res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
