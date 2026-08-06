import os
import csv
import yfinance as yf
import pandas as pd
from typing import List, Optional, Dict, Any
from models.schemas import StockMetadata, HistoricalPricePoint, TrainWindow
from database import cache

class StockDataService:
    def __init__(self):
        self._default_stocks: List[Dict[str, str]] = []
        self._init_stock_registry()

    def _init_stock_registry(self):
        """Loads default stocks from embedded global & NIFTY 50 dictionary without CSV files."""
        from services.default_symbols import DEFAULT_STOCK_REGISTRY
        self._default_stocks = list(DEFAULT_STOCK_REGISTRY)
        print(f"[DataService] Initialized symbol registry with {len(self._default_stocks)} built-in global and NIFTY 50 symbols.")

    def search_tickers(self, query: str) -> List[Dict[str, str]]:
        """Returns matching tickers for search auto-completion."""
        if not query or len(query.strip()) < 1:
            return self._default_stocks[:25]
        
        q_lower = query.lower().strip()
        results = []
        for s in self._default_stocks:
            if q_lower in s["symbol"].lower() or q_lower in s["name"].lower() or q_lower in s["industry"].lower():
                results.append(s)
        
        # If user typed an arbitrary custom ticker not in our list (e.g., INTC or ZOMATO.NS), append it dynamically
        if query.upper() not in [s["symbol"] for s in results]:
            results.insert(0, {
                "symbol": query.upper(),
                "name": f"Custom Ticker ({query.upper()})",
                "industry": "Market Equities",
                "exchange": "Global Exchange"
            })
        return results[:30]

    def fetch_stock_data(self, ticker: str, window: str, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Downloads historical market data and company fundamentals using yFinance.
        Utilizes local cache to prevent repeated API latency.
        """
        cache_key = f"market_data_{ticker.upper()}_{window}_{start_date}_{end_date}"
        cached_res = cache.get(cache_key)
        if cached_res:
            print(f"[DataService] Returning cached market data for {ticker}")
            return cached_res

        print(f"[DataService] Fetching fresh yFinance data for {ticker} (window: {window})...")
        yf_ticker = yf.Ticker(ticker.upper())

        # Determine yFinance period or custom dates
        if window == TrainWindow.MONTHS_3.value or window == "3M":
            df = yf_ticker.history(period="3mo", interval="1d")
        elif window == TrainWindow.MONTHS_6.value or window == "6M":
            df = yf_ticker.history(period="6mo", interval="1d")
        elif window == TrainWindow.YEAR_1.value or window == "1Y":
            df = yf_ticker.history(period="1y", interval="1d")
        elif (window == TrainWindow.CUSTOM.value or window == "CUSTOM") and start_date and end_date:
            df = yf_ticker.history(start=start_date, end=end_date, interval="1d")
        else:
            # Default fallback to 1 year
            df = yf_ticker.history(period="1y", interval="1d")

        if df.empty or len(df) < 5:
            raise ValueError(f"No historical price data could be retrieved for ticker '{ticker}'. Ensure it is a valid Yahoo Finance ticker.")

        # Clean dataframe
        df = df.reset_index()
        df = df.dropna(subset=["Close"])
        
        historical_points = []
        for _, row in df.iterrows():
            # Date can be Timestamp or string
            dt_str = str(row["Date"]).split(" ")[0] if "Date" in df.columns else str(row.name).split(" ")[0]
            close_val = float(row.get("Close", 0.0))
            historical_points.append(HistoricalPricePoint(
                date=dt_str,
                open=float(row.get("Open", close_val)),
                high=float(row.get("High", close_val)),
                low=float(row.get("Low", close_val)),
                close=close_val,
                adj_close=float(row.get("Adj Close", close_val)),
                volume=int(row.get("Volume", 0))
            ).model_dump())

        # Fetch fundamentals and company info
        info = {}
        try:
            info = yf_ticker.info
        except Exception:
            pass # Graceful handling if Yahoo slows down info calls

        metadata = StockMetadata(
            ticker=ticker.upper(),
            company_name=info.get("longName", info.get("shortName", ticker.upper())),
            industry=info.get("industry", "Financial Services & Markets"),
            sector=info.get("sector", "Equity Markets"),
            exchange=info.get("exchange", "Global Stock Market"),
            market_cap=info.get("marketCap", None),
            pe_ratio=info.get("trailingPE", info.get("forwardPE", None)),
            dividend_yield=info.get("dividendYield", None),
            beta=info.get("beta", 1.0),
            eps=info.get("trailingEps", None),
            high_52wk=info.get("fiftyTwoWeekHigh", None),
            low_52wk=info.get("fiftyTwoWeekLow", None)
        ).model_dump()

        result = {
            "metadata": metadata,
            "historical_data": historical_points
        }

        # Save to cache for 1 hour
        cache.set(cache_key, result, ttl=3600)
        return result

data_service = StockDataService()
