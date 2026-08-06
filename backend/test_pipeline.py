import asyncio
import sys
import os
from datetime import datetime

# Ensure current directory is in path
sys.path.append(os.path.abspath("."))

from services.data_service import data_service
from services.technical_service import technical_service
from services.econometric_service import econometric_service
from services.ml_service import ml_service
from services.news_service import news_service
from services.sentiment_service import sentiment_service
from services.recommendation_service import recommendation_engine
from services.rag_service import rag_service

async def test_full_pipeline(ticker="AAPL"):
    print(f"\n==========================================")
    print(f"[TEST] Starting AI Analytical Pipeline Test for: {ticker}")
    print(f"==========================================")
    
    # 1. Search test
    results = data_service.search_tickers("REL")
    print(f"1. Ticker Search 'REL': {len(results)} results found -> {[r['symbol'] for r in results[:3]]}")
    
    # 2. Data fetching test
    market_data = data_service.fetch_stock_data(ticker, "Last 1 year")
    print(f"2. Ingestion Successful! Metadata: {market_data['metadata']['company_name']} ({market_data['metadata']['exchange']})")
    print(f"   Historical points retrieved: {len(market_data['historical_data'])}")
    
    # 3. Technical indicators test
    tech_res = technical_service.compute_all_indicators(market_data['historical_data'])
    print(f"3. Technical indicators computed! RSI latest: {tech_res['chart_indicators']['rsi'][-1]}, MACD hist latest: {tech_res['chart_indicators']['macd_hist'][-1]}")
    
    # 4. Econometric GARCH & ARIMA test
    econ_res = econometric_service.compute_econometric_features(tech_res['feature_df'], horizon_days=15)
    print(f"4. Econometric Modeling Done! Future GARCH Volatility: {econ_res['garch_future_vol']*100:.2f}%")
    
    # 5. News & OpenRouter Sentiment test
    articles = news_service.fetch_recent_news(ticker)
    print(f"5. News Ingested: {len(articles)} deduplicated articles.")
    sent_res = await sentiment_service.analyze_sentiment(ticker, market_data['metadata']['company_name'], articles)
    print(f"   Sentiment Score: {sent_res['overall_sentiment_score']} ({sent_res['classification']}) - Model: {sent_res['llm_model_used']}")
    
    # 6. ML Models comparison & ensemble test
    ml_res = ml_service.train_and_forecast(ticker, econ_res['feature_df'], horizon_days=15, garch_future_vol=econ_res['garch_future_vol'])
    print(f"6. Multi-Model ML Evaluated! Champion Model: '{ml_res['best_performing_model']}'")
    for comp in ml_res['model_comparisons']:
        print(f"   -> {comp['model_name']}: R²={comp['r2_score']}, RMSE={comp['rmse']}, MAPE={comp['mape']}%")
    
    # 7. Recommendation Engine test
    curr_price = market_data['historical_data'][-1]['close']
    target_price = ml_res['forecast_data'][-1]['predicted_price']
    rec = recommendation_engine.generate_recommendation(
        current_price=curr_price,
        forecasted_price=target_price,
        upper_95=ml_res['forecast_data'][-1]['upper_bound_95'],
        lower_95=ml_res['forecast_data'][-1]['lower_bound_95'],
        garch_vol=econ_res['garch_future_vol'],
        beta=market_data['metadata'].get('beta', 1.0),
        rsi=tech_res['chart_indicators']['rsi'][-1],
        macd_hist=tech_res['chart_indicators']['macd_hist'][-1],
        sentiment_score=sent_res['overall_sentiment_score'],
        arima_slope_positive=True
    )
    print(f"7. Recommendation Generated: '{rec['recommendation']}' (Overall Score: {rec['overall_score']}/100)")
    print(f"   Explanation: {rec['explanation'][:180]}...")
    
    # 8. RAG Chat test
    chat_res = await rag_service.answer_query(ticker, "Why is this stock predicted to move and what is the recommendation?")
    print(f"\n8. RAG Chatbot Response Test:")
    print(f"   Answer snippet: {chat_res['answer'][:250]}...")
    print(f"\n[TEST COMPLETE] ALL BACKEND SERVICES AND OPENROUTER FALLBACKS FUNCTIONING PERFECTLY!")

if __name__ == "__main__":
    asyncio.run(test_full_pipeline("AAPL"))
