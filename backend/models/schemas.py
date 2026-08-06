from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from enum import Enum

class TrainWindow(str, Enum):
    MONTHS_3 = "Last 3 months"
    MONTHS_6 = "Last 6 months"
    YEAR_1 = "Last 1 year"
    CUSTOM = "Custom date range"
    FIXED_ROLLING = "Fixed Rolling Window (250 Trading Days)"

class PredictionHorizon(int, Enum):
    DAY_1 = 1
    DAYS_5 = 5
    DAYS_10 = 10
    DAYS_15 = 15 # Retained for legacy backward compatibility if requested
    DAYS_30 = 30 # Retained for legacy backward compatibility if requested

class StockMetadata(BaseModel):
    ticker: str
    company_name: str
    industry: str
    sector: str
    exchange: Optional[str] = None
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    dividend_yield: Optional[float] = None
    beta: Optional[float] = None
    eps: Optional[float] = None
    high_52wk: Optional[float] = None
    low_52wk: Optional[float] = None

class HistoricalPricePoint(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    adj_close: float
    volume: int

class TechnicalIndicators(BaseModel):
    rsi: List[Optional[float]]
    macd: List[Optional[float]]
    macd_signal: List[Optional[float]]
    macd_hist: List[Optional[float]]
    bb_upper: List[Optional[float]]
    bb_middle: List[Optional[float]]
    bb_lower: List[Optional[float]]
    atr: List[Optional[float]]
    adx: List[Optional[float]]
    obv: List[Optional[float]]
    vwap: List[Optional[float]]
    ema: List[Optional[float]]
    sma: List[Optional[float]]
    cci: List[Optional[float]]
    roc: List[Optional[float]]
    williams_r: List[Optional[float]]
    stochastic_k: List[Optional[float]]
    stochastic_d: List[Optional[float]]
    chaikin_money_flow: List[Optional[float]]

class EconometricFeatures(BaseModel):
    garch_conditional_volatility: List[Optional[float]]
    garch_conditional_variance: List[Optional[float]]
    arima_predictions: List[Optional[float]]
    arima_residuals: List[Optional[float]]

class VolatilityMetrics(BaseModel):
    current_volatility_pct: float
    expected_risk: str  # e.g., "Low", "Moderate", "Elevated", "High Risk"
    volatility_trend: str  # e.g., "Contracting", "Stable", "Expanding"
    garch_forecast_vol: float

class ModelEvaluationMetrics(BaseModel):
    model_name: str
    rmse: float
    mse: float = 0.0
    mae: float = 0.0
    mape: float = 0.0
    r2_score: float = 0.0
    training_status: str = "Training Completed Successfully"

class ForecastPoint(BaseModel):
    date: str
    predicted_price: float
    lower_bound_80: float
    upper_bound_80: float
    lower_bound_95: float
    upper_bound_95: float
    expected_volatility: float

class SentimentClassification(str, Enum):
    VERY_BULLISH = "Very Bullish"
    BULLISH = "Bullish"
    NEUTRAL = "Neutral"
    BEARISH = "Bearish"
    VERY_BEARISH = "Very Bearish"

class NewsArticleSentiment(BaseModel):
    headline: str
    summary: str
    source: str
    publication_date: str
    url: Optional[str] = ""
    sentiment: SentimentClassification
    confidence: float
    explanation: str
    key_risks: List[str] = []
    opportunities: List[str] = []
    upcoming_events: List[str] = []

class OverallSentimentAnalysis(BaseModel):
    ticker: str
    overall_sentiment_score: int = Field(..., ge=-100, le=100, description="Score from -100 (Very Bearish) to +100 (Very Bullish)")
    classification: SentimentClassification
    market_sentiment_verdict: str = "Bullish" # Bullish, Neutral, Bearish
    positive_pct: float = 60.0
    neutral_pct: float = 25.0
    negative_pct: float = 15.0
    articles_count: int
    articles: List[NewsArticleSentiment]
    aggregated_risks: List[str]
    aggregated_opportunities: List[str]
    management_announcements: List[str]
    regulatory_impacts: List[str]
    llm_model_used: str

class SHAPExplanation(BaseModel):
    top_features: Dict[str, float] = Field(..., description="Feature name to relative importance score")
    waterfall_data: List[Dict[str, Any]] = Field(..., description="Data points for rendering SHAP waterfall chart")
    local_explanation: str = Field(..., description="Human-readable explanation of why the AI predicted this trajectory")

class InvestmentRecommendation(BaseModel):
    overall_score: int = Field(..., ge=0, le=100, description="Overall investment attractiveness from 0 to 100")
    recommendation: str = Field(..., description="BUY, HOLD, SELL, etc.")
    direction: str = "BUY" # Clean corporate BUY / HOLD / SELL
    prediction_confidence_pct: int = 78 # User-friendly confidence % (e.g. 78%)
    plain_explanation: str = "The forecast is primarily driven by recent price trends, historical market behavior, estimated volatility, and current news sentiment."
    upside_potential: float = Field(..., description="Percentage upside potential")
    downside_risk: float = Field(..., description="Percentage downside risk")
    expected_return: float
    confidence_level: float = Field(..., ge=0.0, le=1.0)
    explanation: str
    key_factors_positive: List[str]
    key_factors_negative: List[str]

class StockAnalysisResponse(BaseModel):
    metadata: StockMetadata
    window_selected: str
    data_start_date: str = ""
    data_end_date: str = ""
    horizon_days: int
    historical_data: List[HistoricalPricePoint]
    technical_indicators: TechnicalIndicators
    econometric_metrics: Dict[str, List[Optional[float]]]
    volatility_metrics: Optional[VolatilityMetrics] = None
    model_comparisons: List[ModelEvaluationMetrics]
    best_performing_model: str
    forecast_data: List[ForecastPoint]
    news_sentiment: OverallSentimentAnalysis
    shap_explanation: SHAPExplanation
    investment_recommendation: InvestmentRecommendation
    computation_time_seconds: float

class RAGChatRequest(BaseModel):
    ticker: str
    query: str
    history: List[Dict[str, str]] = []

class RAGChatResponse(BaseModel):
    answer: str
    grounding_sources: List[str] = []
    model_used: str
