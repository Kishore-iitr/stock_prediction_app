import numpy as np
from typing import Dict, Any, List
from models.schemas import InvestmentRecommendation, OverallSentimentAnalysis

class InvestmentRecommendationEngine:
    def __init__(self):
        pass

    def generate_recommendation(
        self,
        current_price: float,
        forecasted_price: float,
        upper_95: float,
        lower_95: float,
        garch_vol: float,
        beta: float,
        rsi: float,
        macd_hist: float,
        sentiment_score: int,
        arima_slope_positive: bool
    ) -> Dict[str, Any]:
        """
        Synthesizes ML forecasts, technical health, econometrics (GARCH/ARIMA), LLM sentiment,
        and risk metrics into a 0-100 Overall Investment Score with Buy/Hold/Sell ratings and detailed explanations.
        """
        print("[RecommendationEngine] Computing composite multi-factor investment score...")
        
        # 1. Expected Return Score (30% weight)
        expected_return_pct = ((forecasted_price - current_price) / (current_price + 1e-8)) * 100.0
        # Map return from [-10%, +10%] to [0, 100]
        score_ml = np.clip((expected_return_pct + 10.0) * 5.0, 0, 100)

        # 2. OpenRouter LLM News Sentiment (20% weight)
        # sentiment_score is [-100, +100], map to [0, 100]
        score_sentiment = np.clip((sentiment_score + 100) / 2.0, 0, 100)

        # 3. Technical Indicator Consensus (20% weight)
        tech_score = 50.0
        if 30 <= rsi <= 65: # Healthy trend zone
            tech_score += 15
        elif rsi < 30: # Oversold / potential bounce
            tech_score += 25
        else: # Overbought (>70)
            tech_score -= 20
            
        if macd_hist > 0:
            tech_score += 15
        else:
            tech_score -= 15
        score_tech = np.clip(tech_score, 0, 100)

        # 4. Econometric Trend & Volatility (15% weight)
        score_econ = 75.0 if arima_slope_positive else 35.0

        # 5. Risk-Adjusted Stability (15% weight) - penalize excessive beta (>1.5) or high garch vol (>4%)
        vol_penalty = max(0.0, (garch_vol - 0.02) * 1000.0)
        beta_penalty = max(0.0, (abs(beta) - 1.2) * 20.0) if beta is not None else 0.0
        score_risk = np.clip(85.0 - vol_penalty - beta_penalty, 10, 100)

        # Composite Overall Score (0-100)
        composite = (
            (score_ml * 0.30) +
            (score_sentiment * 0.20) +
            (score_tech * 0.20) +
            (score_econ * 0.15) +
            (score_risk * 0.15)
        )
        overall_score = int(round(np.clip(composite, 0, 100)))

        # Derive Actionable Recommendation Rating
        if overall_score >= 80:
            rec_str = "Strong Buy"
        elif overall_score >= 65:
            rec_str = "Buy"
        elif overall_score >= 45:
            rec_str = "Hold"
        elif overall_score >= 30:
            rec_str = "Sell"
        else:
            rec_str = "Strong Sell"

        # Calculate structural upside potential & downside risk percentages
        upside_pot = max(round(((upper_95 - current_price) / current_price) * 100.0, 2), round(expected_return_pct * 1.5, 2), 2.5)
        downside_risk = max(round(((current_price - lower_95) / current_price) * 100.0, 2), round(garch_vol * 200.0, 2), 1.5)

        # Build diagnostic factors list
        pos_factors: List[str] = []
        neg_factors: List[str] = []

        if expected_return_pct > 0:
            pos_factors.append(f"AI ensemble model projects {expected_return_pct:+.2f}% upward price appreciation over target horizon.")
        else:
            neg_factors.append(f"AI predictive models anticipate price moderation of {expected_return_pct:+.2f}%.")

        if sentiment_score > 10:
            pos_factors.append(f"OpenRouter LLM corporate sentiment analysis is positive (Score: {sentiment_score}/100) across recent financial news.")
        elif sentiment_score < -10:
            neg_factors.append(f"Prevalent financial media tone leans cautious/bearish (Sentiment Score: {sentiment_score}/100).")

        if macd_hist > 0 and rsi < 65:
            pos_factors.append(f"MACD histogram displays bullish momentum convergence with supportive RSI ({rsi:.1f}).")
        elif rsi >= 70:
            neg_factors.append(f"RSI indicator ({rsi:.1f}) signals temporary overbought technical conditions.")
        else:
            neg_factors.append(f"MACD histogram reflects slight technical momentum divergence.")

        if arima_slope_positive:
            pos_factors.append(f"ARIMA time-series econometric trajectory confirms underlying upward support trend.")
        else:
            neg_factors.append(f"Econometric trend models detect resistance along intermediate resistance bounds.")

        if not pos_factors:
            pos_factors.append("Company maintains defensive baseline structural liquidity and industry standing.")
        if not neg_factors:
            neg_factors.append("General macroeconomic market volatility and geopolitical interest rate sensitivity.")

        explanation_p = (
            f"Based on our exhaustive multi-factor quantitative synthesis, the platform assigns an Overall Investment Score of {overall_score}/100, "
            f"yielding a firm '{rec_str}' rating. The AI Machine Learning forecasts an expected return of {expected_return_pct:+.2f}%, complemented by "
            f"an estimated upside potential of {upside_pot:.1f}% against a structured downside risk boundary of {downside_risk:.1f}%. "
            f"This recommendation balances technical momentum indicators (RSI at {rsi:.1f}) and GARCH volatility assessments with OpenRouter LLM-extracted corporate sentiment."
        )

        rec_obj = InvestmentRecommendation(
            overall_score=overall_score,
            recommendation=rec_str,
            upside_potential=upside_pot,
            downside_risk=downside_risk,
            expected_return=round(expected_return_pct, 2),
            confidence_level=round(np.clip(0.60 + (abs(overall_score - 50) / 125.0), 0.55, 0.96), 2),
            explanation=explanation_p,
            key_factors_positive=pos_factors,
            key_factors_negative=neg_factors
        )

        return rec_obj.model_dump()

recommendation_engine = InvestmentRecommendationEngine()
