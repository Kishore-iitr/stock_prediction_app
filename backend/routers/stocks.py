from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any, Optional
from services.data_service import data_service
from models.schemas import TrainWindow

router = APIRouter()

@router.get("/search", response_model=List[Dict[str, str]], summary="Autocomplete Stock Tickers")
async def search_tickers(query: str = Query("", description="Ticker symbol or corporate keyword")):
    try:
        return data_service.search_tickers(query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{ticker}/data", summary="Fetch Historical Prices & Fundamentals")
async def get_stock_data(
    ticker: str,
    window: str = Query("Last 1 year", description="Historical training window"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    try:
        data = data_service.fetch_stock_data(ticker, window, start_date, end_date)
        return data
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Failed to fetch market data: {str(e)}")
