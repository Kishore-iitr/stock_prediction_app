"use client";
import React, { useState } from "react";
import ReactECharts from "echarts-for-react";
import { useStockStore } from "@/store/useStockStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Layers, Eye } from "lucide-react";

export function CandlestickChart() {
  const { analysisData } = useStockStore();
  const [activeOverlay, setActiveOverlay] = useState<"EMA" | "SMA" | "BOL" | "VWAP" | "ALL" | "NONE">("ALL");

  if (!analysisData || !analysisData.historical_data.length) {
    return (
      <Card className="h-[520px] flex items-center justify-center border-dashed border-slate-700">
        <div className="text-center text-slate-500">
          <LineChart className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-medium">No market pricing data loaded yet. Click &apos;Analyze Stock&apos; above.</p>
        </div>
      </Card>
    );
  }

  const { historical_data, technical_indicators, metadata } = analysisData;

  const dates = historical_data.map((d) => d.date);
  const candleData = historical_data.map((d) => [round(d.open), round(d.close), round(d.low), round(d.high)]);
  const volumes = historical_data.map((d, idx) => [idx, d.volume, d.close >= d.open ? 1 : -1]);

  function round(num: number) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  const showEma = activeOverlay === "EMA" || activeOverlay === "ALL";
  const showSma = activeOverlay === "SMA" || activeOverlay === "ALL";
  const showBol = activeOverlay === "BOL" || activeOverlay === "ALL";
  const showVwap = activeOverlay === "VWAP" || activeOverlay === "ALL";

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross", lineStyle: { color: "#64748b", width: 1, type: "dashed" } },
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      borderColor: "#334155",
      textStyle: { color: "#f8fafc", fontSize: 12 },
      borderWidth: 1,
      padding: [10, 14],
    },
    axisPointer: { link: [{ xAxisIndex: "all" }] },
    legend: {
      data: [
        "Candlestick", 
        ...(showEma ? ["EMA (20)"] : []), 
        ...(showSma ? ["SMA (50)"] : []),
        ...(showVwap ? ["VWAP"] : []),
        ...(showBol ? ["Bollinger Upper", "Bollinger Lower"] : [])
      ],
      textStyle: { color: "#94a3b8", fontSize: 11 },
      top: 5,
      right: 20,
    },
    grid: [
      { left: "5%", right: "3%", top: "12%", height: "62%" },
      { left: "5%", right: "3%", top: "78%", height: "16%" },
    ],
    xAxis: [
      {
        type: "category",
        data: dates,
        scale: true,
        boundaryGap: false,
        axisLine: { lineStyle: { color: "#334155" } },
        splitLine: { show: false },
        axisLabel: { color: "#64748b", fontSize: 11 },
      },
      {
        type: "category",
        gridIndex: 1,
        data: dates,
        axisLabel: { show: false },
        axisLine: { lineStyle: { color: "#334155" } },
        splitLine: { show: false },
      },
    ],
    yAxis: [
      {
        scale: true,
        splitArea: { show: false },
        axisLine: { lineStyle: { color: "#334155" } },
        splitLine: { lineStyle: { color: "#1e293b", type: "dashed" } },
        axisLabel: { color: "#94a3b8", formatter: (val: number) => `₹${val.toLocaleString()}` },
      },
      {
        gridIndex: 1,
        splitNumber: 3,
        axisLine: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
      },
    ],
    dataZoom: [
      { type: "inside", xAxisIndex: [0, 1], start: 40, end: 100 },
      {
        show: true,
        type: "slider",
        xAxisIndex: [0, 1],
        top: "96%",
        height: 14,
        borderColor: "#334155",
        fillerColor: "rgba(16, 185, 129, 0.2)",
        handleStyle: { color: "#10b981" },
        textStyle: { color: "#64748b" },
      },
    ],
    series: [
      {
        name: "Candlestick",
        type: "candlestick",
        data: candleData,
        itemStyle: {
          color: "#10b981", // Bullish Emerald
          color0: "#ef4444", // Bearish Rose
          borderColor: "#10b981",
          borderColor0: "#ef4444",
        },
      },
      ...(showEma ? [{
        name: "EMA (20)",
        type: "line",
        data: technical_indicators.ema || [],
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 1.5, color: "#38bdf8" }, // Sky Blue
      }] : []),
      ...(showSma ? [{
        name: "SMA (50)",
        type: "line",
        data: technical_indicators.sma || [],
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 1.5, color: "#f59e0b" }, // Amber
      }] : []),
      ...(showVwap ? [{
        name: "VWAP",
        type: "line",
        data: technical_indicators.vwap || [],
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 1.5, color: "#a855f7", type: "dashed" }, // Purple dashed
      }] : []),
      ...(showBol ? [
        {
          name: "Bollinger Upper",
          type: "line",
          data: technical_indicators.bb_upper || [],
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 1, color: "#64748b", opacity: 0.6 },
        },
        {
          name: "Bollinger Lower",
          type: "line",
          data: technical_indicators.bb_lower || [],
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 1, color: "#64748b", opacity: 0.6 },
          areaStyle: { color: "rgba(100, 116, 139, 0.08)" },
        }
      ] : []),
      {
        name: "Volume",
        type: "bar",
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: volumes.map((v) => ({
          value: v[1],
          itemStyle: { color: v[2] === 1 ? "rgba(16, 185, 129, 0.65)" : "rgba(239, 68, 68, 0.65)" },
        })),
      },
    ],
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <LineChart className="w-5 h-5 text-emerald-400" />
          <span>{metadata.company_name} ({metadata.ticker}) Price History & Indicators</span>
        </CardTitle>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" /> Overlays:
          </span>
          {(["ALL", "EMA", "SMA", "BOL", "VWAP", "NONE"] as const).map((item) => (
            <button
              key={item}
              onClick={() => setActiveOverlay(item)}
              className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${
                activeOverlay === item
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold"
                  : "bg-slate-800/60 text-slate-400 hover:text-white border border-slate-700/60"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <ReactECharts option={option} style={{ height: "460px", width: "100%" }} className="rounded-lg" />
      </CardContent>
    </Card>
  );
}
