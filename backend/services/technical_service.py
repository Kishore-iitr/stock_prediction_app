import numpy as np
import pandas as pd
from typing import Dict, List, Optional
from models.schemas import HistoricalPricePoint, TechnicalIndicators

class TechnicalAnalysisService:
    def __init__(self):
        pass

    def compute_all_indicators(self, historical_data: List[Dict[str, any]]) -> Dict[str, any]:
        """
        Computes 15+ comprehensive technical indicators and statistical momentum features
        using clean vectorized NumPy and Pandas calculations.
        Returns both formatted indicator series for charting and raw feature dataframe for ML.
        """
        df = pd.DataFrame(historical_data)
        close = df["close"].astype(float)
        high = df["high"].astype(float)
        low = df["low"].astype(float)
        volume = df["volume"].astype(float)
        open_p = df["open"].astype(float)

        n = len(df)
        
        # 1. Price Momentum & Rolling Statistics
        daily_returns = close.pct_change().fillna(0.0)
        log_returns = np.log(close / close.shift(1)).fillna(0.0)
        rolling_mean_20 = close.rolling(window=min(20, n), min_periods=1).mean()
        rolling_std_20 = close.rolling(window=min(20, n), min_periods=1).std().fillna(0.0)
        rolling_volatility_20 = log_returns.rolling(window=min(20, n), min_periods=1).std().fillna(0.0) * np.sqrt(252)
        price_momentum_10 = (close / close.shift(min(10, n-1)).replace(0, np.nan) - 1.0).fillna(0.0)
        
        # Trend Slope (14-day linear regression slope normalized)
        trend_slope = np.zeros(n)
        window_slope = min(14, n)
        for i in range(window_slope, n):
            y_slice = close.iloc[i-window_slope:i].values
            x_slice = np.arange(window_slope)
            slope, _ = np.polyfit(x_slice, y_slice, 1)
            trend_slope[i] = slope / y_slice[0] if y_slice[0] != 0 else 0
        df_trend_slope = pd.Series(trend_slope)

        # 2. RSI (14 period)
        delta = close.diff()
        gain = (delta.where(delta > 0, 0.0)).rolling(window=min(14, n), min_periods=1).mean()
        loss = (-delta.where(delta < 0, 0.0)).rolling(window=min(14, n), min_periods=1).mean()
        rs = gain / loss.replace(0, 1e-8)
        rsi = 100.0 - (100.0 / (1.0 + rs))
        rsi = rsi.fillna(50.0)

        # 3. MACD (12, 26, 9)
        ema_fast = close.ewm(span=12, adjust=False).mean()
        ema_slow = close.ewm(span=26, adjust=False).mean()
        macd = ema_fast - ema_slow
        macd_signal = macd.ewm(span=9, adjust=False).mean()
        macd_hist = macd - macd_signal

        # 4. Bollinger Bands (20-day SMA +/- 2*STD)
        bb_middle = rolling_mean_20
        bb_upper = bb_middle + 2.0 * rolling_std_20
        bb_lower = bb_middle - 2.0 * rolling_std_20

        # 5. ATR (Average True Range - 14 period)
        tr1 = high - low
        tr2 = (high - close.shift(1)).abs()
        tr3 = (low - close.shift(1)).abs()
        true_range = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        atr = true_range.rolling(window=min(14, n), min_periods=1).mean().fillna(0.0)

        # 6. ADX (Average Directional Index - 14 period)
        up_move = high - high.shift(1)
        down_move = low.shift(1) - low
        plus_dm = np.where((up_move > down_move) & (up_move > 0), up_move, 0.0)
        minus_dm = np.where((down_move > up_move) & (down_move > 0), down_move, 0.0)
        plus_di = 100 * (pd.Series(plus_dm).rolling(min(14, n), min_periods=1).mean() / (atr + 1e-8))
        minus_di = 100 * (pd.Series(minus_dm).rolling(min(14, n), min_periods=1).mean() / (atr + 1e-8))
        dx = 100 * np.abs(plus_di - minus_di) / (plus_di + minus_di + 1e-8)
        adx = pd.Series(dx).rolling(min(14, n), min_periods=1).mean().fillna(25.0)

        # 7. OBV (On-Balance Volume)
        direction = np.sign(close.diff()).fillna(0)
        obv = (volume * direction).cumsum().fillna(0.0)

        # 8. VWAP (Volume-Weighted Average Price)
        typical_price = (high + low + close) / 3.0
        cum_vp = (typical_price * volume).cumsum()
        cum_vol = volume.cumsum()
        vwap = (cum_vp / cum_vol.replace(0, 1.0)).fillna(close)

        # 9. EMA (20 & 50 period) and SMA (20 & 50 period)
        ema_20 = close.ewm(span=min(20, n), adjust=False).mean()
        sma_50 = close.rolling(window=min(50, n), min_periods=1).mean()

        # 10. CCI (Commodity Channel Index - 20 period)
        tp = (high + low + close) / 3.0
        tp_rolling = tp.rolling(min(20, n), min_periods=1).mean()
        md = tp.rolling(min(20, n), min_periods=1).apply(lambda x: np.mean(np.abs(x - np.mean(x))), raw=True).fillna(1.0)
        cci = ((tp - tp_rolling) / (0.015 * md.replace(0, 1.0))).fillna(0.0)

        # 11. ROC (Rate of Change - 12 period)
        roc = ((close - close.shift(min(12, n-1))) / close.shift(min(12, n-1)).replace(0, np.nan)) * 100.0
        roc = roc.fillna(0.0)

        # 12. Williams %R (-14 period)
        highest_high_14 = high.rolling(min(14, n), min_periods=1).max()
        lowest_low_14 = low.rolling(min(14, n), min_periods=1).min()
        williams_r = -100.0 * ((highest_high_14 - close) / ((highest_high_14 - lowest_low_14).replace(0, np.nan) + 1e-8))
        williams_r = williams_r.fillna(-50.0)

        # 13. Stochastic Oscillator (%K and %D)
        stoch_k = 100.0 * ((close - lowest_low_14) / ((highest_high_14 - lowest_low_14).replace(0, np.nan) + 1e-8))
        stoch_k = stoch_k.fillna(50.0)
        stoch_d = stoch_k.rolling(min(3, n), min_periods=1).mean()

        # 14. Chaikin Money Flow (CMF - 20 period)
        mf_multiplier = ((close - low) - (high - close)) / ((high - low).replace(0, np.nan) + 1e-8)
        mf_volume = mf_multiplier * volume
        cmf = mf_volume.rolling(min(20, n), min_periods=1).sum() / volume.rolling(min(20, n), min_periods=1).sum().replace(0, 1.0)
        cmf = cmf.fillna(0.0)

        def to_list(series: pd.Series) -> List[Optional[float]]:
            return [round(float(x), 4) if not np.isnan(x) and not np.isinf(x) else 0.0 for x in series.tolist()]

        chart_indicators = {
            "rsi": to_list(rsi),
            "macd": to_list(macd),
            "macd_signal": to_list(macd_signal),
            "macd_hist": to_list(macd_hist),
            "bb_upper": to_list(bb_upper),
            "bb_middle": to_list(bb_middle),
            "bb_lower": to_list(bb_lower),
            "atr": to_list(atr),
            "adx": to_list(adx),
            "obv": to_list(obv),
            "vwap": to_list(vwap),
            "ema": to_list(ema_20),
            "sma": to_list(sma_50),
            "cci": to_list(cci),
            "roc": to_list(roc),
            "williams_r": to_list(williams_r),
            "stochastic_k": to_list(stoch_k),
            "stochastic_d": to_list(stoch_d),
            "chaikin_money_flow": to_list(cmf)
        }

        # Build combined feature DataFrame for ML models
        feature_df = pd.DataFrame({
            "open": open_p,
            "high": high,
            "low": low,
            "close": close,
            "volume": volume,
            "daily_returns": daily_returns,
            "log_returns": log_returns,
            "rolling_mean_20": rolling_mean_20,
            "rolling_std_20": rolling_std_20,
            "rolling_volatility_20": rolling_volatility_20,
            "price_momentum_10": price_momentum_10,
            "trend_slope": df_trend_slope,
            "rsi": rsi,
            "macd": macd,
            "macd_hist": macd_hist,
            "bb_upper": bb_upper,
            "bb_lower": bb_lower,
            "atr": atr,
            "adx": adx,
            "obv": obv,
            "vwap": vwap,
            "ema_20": ema_20,
            "sma_50": sma_50,
            "cci": cci,
            "roc": roc,
            "williams_r": williams_r,
            "stoch_k": stoch_k,
            "cmf": cmf
        })

        return {
            "chart_indicators": chart_indicators,
            "feature_df": feature_df
        }

technical_service = TechnicalAnalysisService()
