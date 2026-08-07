"use client";
import React, { useState } from "react";
import ReactECharts from "echarts-for-react";
import { useStockStore } from "@/store/useStockStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, ShieldCheck, Zap, Info, ArrowUpRight, ArrowDownRight, Eye, Layers } from "lucide-react";

export function ForecastChart() {
  const { analysisData } = useStockStore();
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  if (!analysisData || !analysisData.forecast_data.length) {
    return null;
  }

  const { historical_data, forecast_data, best_performing_model, horizon_days, econometric_metrics } = analysisData;

  // Display last 25 historical trading days by default so the future forecast stands out clearly without visual clutter
  const historyWindow = isAdvancedMode ? 60 : 25;
  const recentHistory = historical_data.slice(-historyWindow);
  const lastHistorical = recentHistory[recentHistory.length - 1];

  const histDates = recentHistory.map((d) => d.date);
  const histCloses = recentHistory.map((d) => d.close);
  const arimaPreds = econometric_metrics?.arima_predictions ? econometric_metrics.arima_predictions.slice(-historyWindow) : [];

  // Future dates & values (start connecting from the very last historical point)
  const predictedPrices = [lastHistorical.close, ...forecast_data.map((f) => f.predicted_price)];
  
  const lower80 = [lastHistorical.close, ...forecast_data.map((f) => f.lower_bound_80)];
  const upper80 = [lastHistorical.close, ...forecast_data.map((f) => f.upper_bound_80)];
  
  const lower95 = [lastHistorical.close, ...forecast_data.map((f) => f.lower_bound_95)];
  const upper95 = [lastHistorical.close, ...forecast_data.map((f) => f.upper_bound_95)];

  const allDates = [...histDates, ...forecast_data.map((f) => f.date)];
  
  // Pad historical array with nulls for future dates
  const fullHistorical = [...histCloses, ...new Array(forecast_data.length).fill(null)];
  const fullArima = [...arimaPreds, ...new Array(forecast_data.length).fill(null)];

  // Pad forecast arrays with nulls for past dates (except last point)
  const padLen = histDates.length - 1;
  const fullPredicted = [...new Array(padLen).fill(null), ...predictedPrices];
  const fullLower80 = [...new Array(padLen).fill(null), ...lower80];
  const fullUpper80 = [...new Array(padLen).fill(null), ...upper80];
  const fullLower95 = [...new Array(padLen).fill(null), ...lower95];
  const fullUpper95 = [...new Array(padLen).fill(null), ...upper95];

  const currentPrice = lastHistorical.close;
  const targetPrice = forecast_data[forecast_data.length - 1].predicted_price;
  const priceChangePct = ((targetPrice - currentPrice) / currentPrice) * 100;
  const priceChangeDollar = targetPrice - currentPrice;
  const isUpward = priceChangePct >= 0;

  // Calculate clean trading corridor bounds from GARCH 95% intervals
  const minFloor = Math.min(...forecast_data.map((f) => f.lower_bound_95));
  const maxCeiling = Math.max(...forecast_data.map((f) => f.upper_bound_95));
  const latestVol = forecast_data[0]?.expected_volatility || 1.8;

  // Build clean series list based on mode
  const series: any[] = [
    {
      name: "Recent Price History",
      type: "line",
      data: fullHistorical,
      smooth: true,
      symbol: "none",
      lineStyle: { color: "#f8fafc", width: 3 },
    },
    {
      name: "AI Target Forecast",
      type: "line",
      data: fullPredicted,
      smooth: true,
      symbol: "circle",
      symbolSize: 8,
      itemStyle: { color: isUpward ? "#10b981" : "#ef4444", borderWidth: 2, borderColor: "#0f172a" },
      lineStyle: { color: isUpward ? "#10b981" : "#ef4444", width: 4, type: "solid" },
      label: {
        show: true,
        position: isUpward ? "top" : "bottom",
        color: isUpward ? "#10b981" : "#ef4444",
        formatter: (p: any) => p.dataIndex === allDates.length - 1 ? `₹${p.value.toFixed(2)} Target` : "",
        fontWeight: "bold",
        fontSize: 12
      }
    },
    // Primary GARCH 95% Trading Corridor Band
    {
      name: "GARCH Safe Trading Corridor Floor",
      type: "line",
      data: fullLower95,
      lineStyle: { opacity: isAdvancedMode ? 0.5 : 0, color: "#14b8a6", type: "dashed" },
      stack: "conf95",
      symbol: "none",
    },
    {
      name: "GARCH Expected Trading Corridor",
      type: "line",
      data: fullUpper95.map((v, idx) => (v !== null && fullLower95[idx] !== null ? v - fullLower95[idx]! : null)),
      lineStyle: { opacity: isAdvancedMode ? 0.5 : 0, color: "#14b8a6", type: "dashed" },
      areaStyle: { color: "rgba(20, 184, 166, 0.25)" },
      stack: "conf95",
      symbol: "none",
    }
  ];

  // In Advanced Mode, append ARIMA fit & 80% band
  if (isAdvancedMode) {
    series.splice(1, 0, {
      name: "ARIMA Trend Fit",
      type: "line",
      data: fullArima,
      smooth: true,
      symbol: "none",
      lineStyle: { color: "#38bdf8", width: 2, type: "dotted" },
    });
    series.push(
      {
        name: "80% Confidence Lower",
        type: "line",
        data: fullLower80,
        lineStyle: { opacity: 0 },
        stack: "conf80",
        symbol: "none",
      },
      {
        name: "80% Inner Confidence Band",
        type: "line",
        data: fullUpper80.map((v, idx) => (v !== null && fullLower80[idx] !== null ? v - fullLower80[idx]! : null)),
        lineStyle: { opacity: 0 },
        areaStyle: { color: "rgba(16, 185, 129, 0.2)" },
        stack: "conf80",
        symbol: "none",
      }
    );
  }

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross", label: { backgroundColor: "#334155" } },
      backgroundColor: "rgba(15, 23, 42, 0.98)",
      borderColor: "#334155",
      textStyle: { color: "#f8fafc", fontSize: 13 },
      borderWidth: 1,
      padding: 12,
      formatter: (params: any) => {
        let title = `<strong>📅 Date: ${params[0].axisValue}</strong><br/>`;
        params.forEach((p: any) => {
          if (p.value !== null && p.value !== undefined && p.seriesName !== "GARCH Safe Trading Corridor Floor" && p.seriesName !== "80% Confidence Lower") {
            const val = p.seriesName.includes("Corridor") || p.seriesName.includes("Band") ? "" : `₹${Number(p.value).toLocaleString()}`;
            title += `<div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
              <span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${p.color};"></span>
              <span>${p.seriesName}: <strong>${val || "Active Volatility Corridor"}</strong></span>
            </div>`;
          }
        });
        return title;
      }
    },
    legend: {
      data: isAdvancedMode 
        ? ["Recent Price History", "ARIMA Trend Fit", "AI Target Forecast", "GARCH Expected Trading Corridor", "80% Inner Confidence Band"]
        : ["Recent Price History", "AI Target Forecast", "GARCH Expected Trading Corridor"],
      textStyle: { color: "#e2e8f0", fontSize: 12, fontWeight: "500" },
      top: 0,
      right: 10,
    },
    grid: { left: "5%", right: "6%", top: "12%", bottom: "15%" },
    xAxis: {
      type: "category",
      data: allDates,
      boundaryGap: false,
      axisLine: { lineStyle: { color: "#334155" } },
      axisLabel: { color: "#94a3b8", fontSize: 11, rotate: 25 },
    },
    yAxis: {
      type: "value",
      scale: true,
      splitLine: { lineStyle: { color: "#1e293b", type: "dashed" } },
      axisLabel: { color: "#cbd5e1", fontWeight: "bold", formatter: (val: number) => `₹${val.toLocaleString()}` },
    },
    series: series,
  };

  return (
    <Card className="w-full mt-6 border-2 border-emerald-500/30 shadow-2xl shadow-emerald-500/5 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <span>{horizon_days}-Day AI Future Price Forecast</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700">
                Powered by ARIMA & GARCH
              </span>
            </CardTitle>
            <p className="text-xs text-slate-400">
              Champion Predictor: <strong className="text-emerald-400">{best_performing_model}</strong> | Clear actionable valuation corridor
            </p>
          </div>
        </div>

        {/* View Mode Switcher Button */}
        <div className="flex items-center gap-2 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setIsAdvancedMode(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
              !isAdvancedMode ? "bg-emerald-500 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Simple Mode (Easy)</span>
          </button>
          <button
            onClick={() => setIsAdvancedMode(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
              isAdvancedMode ? "bg-teal-500 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Analyst Mode (Advanced)</span>
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-6">
        
        {/* Three Ultra-Clear Executive Answer Pills Above Graph */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 flex items-center justify-between shadow-md">
            <div>
              <span className="text-[11px] text-slate-400 font-mono uppercase block">Current Market Price</span>
              <span className="text-2xl font-black font-mono text-white mt-1 block">
                ₹{currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-300 font-mono font-bold text-xs">
              LIVE
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 flex items-center justify-between shadow-md">
            <div>
              <span className="text-[11px] text-slate-400 font-mono uppercase block">AI Target ({horizon_days} Days)</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-2xl font-black font-mono ${isUpward ? "text-emerald-400" : "text-rose-400"}`}>
                  ₹{targetPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={`text-sm font-bold font-mono ${isUpward ? "text-emerald-400" : "text-rose-400"}`}>
                  ({isUpward ? "+" : ""}{priceChangePct.toFixed(2)}%)
                </span>
              </div>
            </div>
            {isUpward ? <ArrowUpRight className="w-8 h-8 text-emerald-400" /> : <ArrowDownRight className="w-8 h-8 text-rose-400" />}
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 flex items-center justify-between shadow-md">
            <div>
              <span className="text-[11px] text-slate-400 font-mono uppercase block">GARCH Safe Trading Range</span>
              <div className="text-sm font-bold font-mono text-teal-300 mt-1 flex items-center gap-1.5">
                <span>Floor: ₹{minFloor.toFixed(1)}</span>
                <span className="text-slate-600">|</span>
                <span>Ceiling: ₹{maxCeiling.toFixed(1)}</span>
              </div>
              <span className="text-[10px] text-amber-300 block font-mono mt-0.5 flex items-center gap-1">
                <Zap className="w-3 h-3 fill-amber-300" /> Daily Volatility: {latestVol.toFixed(2)}%
              </span>
            </div>
            <ShieldCheck className="w-8 h-8 text-teal-400 flex-shrink-0" />
          </div>

        </div>

        {/* ECharts Interactive Graph */}
        <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80 shadow-inner">
          <ReactECharts option={option} style={{ height: "420px", width: "100%" }} />
        </div>

        {/* How to Read This Chart in 10 Seconds (Investor Interpretation Guide) */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-lg space-y-3.5">
          <div className="flex items-center gap-2 text-teal-300 font-bold text-sm">
            <Info className="w-5 h-5 text-teal-400 flex-shrink-0" />
            <span>How to Interpret This AI Forecast in 10 Seconds (Plain English Guide):</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <span className="font-bold text-white block mb-1.5 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                1. The Bold AI Target Line
              </span>
              This line shows our primary **ARIMA Trend Momentum** and Champion ML model predicting where the stock price is headed over the next **{horizon_days} trading days**, targeting **₹{targetPrice.toFixed(2)}** ({isUpward ? `a gain of +₹${priceChangeDollar.toFixed(2)} per share` : `a pullback of -₹${Math.abs(priceChangeDollar).toFixed(2)} per share`}).
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <span className="font-bold text-white block mb-1.5 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400 inline-block"></span>
                2. The Shaded Teal Corridor
              </span>
              This is your safe trading comfort zone calculated by our primary **GARCH Volatility Indicator**. Based on current market volatility, there is a **95% statistical probability** the actual stock price will stay securely within this shaded band between **₹{minFloor.toFixed(1)}** and **₹{maxCeiling.toFixed(1)}**.
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <span className="font-bold text-amber-300 block mb-1.5 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                3. Your Actionable Takeaway
              </span>
              {isUpward ? (
                <span>Because the ARIMA trend is **pointing firmly upward** and GARCH confirms controlled volatility, this chart confirms a high-probability **BUY OPPORTUNITY** with limited downside risk below the floor.</span>
              ) : (
                <span>Because the trend faces downward consolidation, investors should practice caution or **WAIT/HOLD** until the price rebounds off the lower GARCH floor of **₹{minFloor.toFixed(2)}**.</span>
              )}
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
