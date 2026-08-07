export type TrainWindow = "Last 3 months" | "Last 6 months" | "Last 1 year" | "Custom date range";
export type PredictionHorizon = 1 | 5 | 10 | 15 | 30;
export type SentimentClassification = "Very Bullish" | "Bullish" | "Neutral" | "Bearish" | "Very Bearish";

export interface StockMetadata {
  ticker: string;
  company_name: string;
  industry: string;
  sector: string;
  exchange?: string;
  market_cap?: number | null;
  pe_ratio?: number | null;
  dividend_yield?: number | null;
  beta?: number | null;
  eps?: number | null;
  high_52wk?: number | null;
  low_52wk?: number | null;
}

export interface HistoricalPricePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adj_close: number;
  volume: number;
}

export interface TechnicalIndicators {
  rsi: number[];
  macd: number[];
  macd_signal: number[];
  macd_hist: number[];
  bb_upper: number[];
  bb_middle: number[];
  bb_lower: number[];
  atr: number[];
  adx: number[];
  obv: number[];
  vwap: number[];
  ema: number[];
  sma: number[];
  cci: number[];
  roc: number[];
  williams_r: number[];
  stochastic_k: number[];
  stochastic_d: number[];
  chaikin_money_flow: number[];
  [key: string]: number[];
}

export interface EconometricMetrics {
  garch_conditional_volatility: number[];
  garch_conditional_variance: number[];
  arima_predictions: number[];
  arima_residuals: number[];
  [key: string]: number[];
}

export interface VolatilityMetrics {
  current_volatility_pct: number;
  expected_risk: string;
  volatility_trend: string;
  garch_forecast_vol: number;
}

export interface ModelEvaluationMetrics {
  model_name: string;
  rmse: number;
  mse: number;
  mae: number;
  mape: number;
  r2_score: number;
  training_status?: string;
}

export interface ForecastPoint {
  date: string;
  predicted_price: number;
  lower_bound_80: number;
  upper_bound_80: number;
  lower_bound_95: number;
  upper_bound_95: number;
  expected_volatility: number;
}

export interface NewsArticleSentiment {
  headline: string;
  summary: string;
  source: string;
  publication_date: string;
  url?: string;
  sentiment: SentimentClassification;
  confidence: number;
  explanation: string;
  key_risks: string[];
  opportunities: string[];
  upcoming_events?: string[];
}

export interface OverallSentimentAnalysis {
  ticker: string;
  overall_sentiment_score: number;
  classification: SentimentClassification;
  market_sentiment_verdict?: string;
  positive_pct?: number;
  neutral_pct?: number;
  negative_pct?: number;
  articles_count: number;
  articles: NewsArticleSentiment[];
  aggregated_risks: string[];
  aggregated_opportunities: string[];
  management_announcements?: string[];
  regulatory_impacts?: string[];
  llm_model_used: string;
}

export interface SHAPExplanation {
  top_features: Record<string, number>;
  waterfall_data: Array<{
    name: string;
    type: "total" | "positive" | "negative";
    value: number;
    delta: number;
    text: string;
  }>;
  local_explanation: string;
}

export interface InvestmentRecommendation {
  overall_score: number;
  recommendation: string;
  direction?: string;
  prediction_confidence_pct?: number;
  plain_explanation?: string;
  upside_potential: number;
  downside_risk: number;
  expected_return: number;
  confidence_level: number;
  explanation: string;
  key_factors_positive: string[];
  key_factors_negative: string[];
}

export interface StockAnalysisResponse {
  metadata: StockMetadata;
  window_selected: string;
  data_start_date?: string;
  data_end_date?: string;
  horizon_days: number;
  historical_data: HistoricalPricePoint[];
  technical_indicators: TechnicalIndicators;
  econometric_metrics: EconometricMetrics;
  volatility_metrics?: VolatilityMetrics;
  model_comparisons: ModelEvaluationMetrics[];
  best_performing_model: string;
  forecast_data: ForecastPoint[];
  news_sentiment: OverallSentimentAnalysis;
  shap_explanation: SHAPExplanation;
  investment_recommendation: InvestmentRecommendation;
  computation_time_seconds: number;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  sources?: string[];
  modelUsed?: string;
  timestamp: string;
}
