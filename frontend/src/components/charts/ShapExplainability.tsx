"use client";
import React, { useState } from "react";
import ReactECharts from "echarts-for-react";
import { useStockStore } from "@/store/useStockStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sparkles, BarChart3, HelpCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";

export function ShapExplainability() {
  const { analysisData } = useStockStore();
  const [viewMode, setViewMode] = useState<"waterfall" | "importance">("waterfall");

  if (!analysisData || !analysisData.shap_explanation) {
    return null;
  }

  const { top_features, waterfall_data, local_explanation } = analysisData.shap_explanation;

  // 1. Feature Importance Horizontal Bar Chart Option
  const impNames = Object.keys(top_features).reverse();
  const impVals = Object.values(top_features).reverse().map(v => Number((v * 100).toFixed(2)));

  const impOption = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      borderColor: "#334155",
      textStyle: { color: "#f8fafc" },
      formatter: (params: any) => `${params[0].name}: <strong>${params[0].value}%</strong> predictive weighting`,
    },
    grid: { left: "28%", right: "6%", top: "8%", bottom: "10%" },
    xAxis: {
      type: "value",
      axisLine: { lineStyle: { color: "#334155" } },
      splitLine: { lineStyle: { color: "#1e293b", type: "dashed" } },
      axisLabel: { color: "#94a3b8", formatter: "{value}%" },
    },
    yAxis: {
      type: "category",
      data: impNames.map((n) => n.replace("_", " ").toUpperCase()),
      axisLine: { lineStyle: { color: "#334155" } },
      axisLabel: { color: "#cbd5e1", fontSize: 11, fontWeight: "bold" },
    },
    series: [
      {
        type: "bar",
        data: impVals,
        itemStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: "#0d9488" },
              { offset: 1, color: "#10b981" },
            ],
          },
          borderRadius: [0, 4, 4, 0],
        },
        label: {
          show: true,
          position: "right",
          color: "#10b981",
          formatter: "{c}%",
          fontSize: 11,
          fontWeight: "bold"
        },
      },
    ],
  };

  // 2. Waterfall Option (Explaining step-by-step price prediction drivers)
  const wfNames = waterfall_data.map((w) => w.name);
  const wfTotals: Array<number | null> = [];
  const wfPos: Array<number | null> = [];
  const wfNeg: Array<number | null> = [];
  const wfAux: Array<number> = []; // invisible base support line

  let currBase = 0;
  waterfall_data.forEach((w, i) => {
    if (w.type === "total") {
      wfTotals.push(w.value);
      wfPos.push(null);
      wfNeg.push(null);
      wfAux.push(0);
      currBase = w.value;
    } else if (w.type === "positive") {
      wfTotals.push(null);
      wfPos.push(w.delta);
      wfNeg.push(null);
      wfAux.push(currBase);
      currBase += w.delta;
    } else {
      wfTotals.push(null);
      wfPos.push(null);
      wfNeg.push(Math.abs(w.delta));
      wfAux.push(currBase - Math.abs(w.delta));
      currBase -= Math.abs(w.delta);
    }
  });

  const wfOption = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      borderColor: "#334155",
      textStyle: { color: "#f8fafc" },
      formatter: (params: any) => {
        const idx = params[0].dataIndex;
        const item = waterfall_data[idx];
        return `<strong>${item.name}</strong><br/>Contribution: <span style="color:${item.delta >= 0 ? '#10b981' : '#ef4444'}">${item.text}</span><br/>Cumulative Target: $${item.value.toLocaleString()}`;
      }
    },
    grid: { left: "12%", right: "6%", top: "12%", bottom: "18%" },
    xAxis: {
      type: "category",
      data: wfNames,
      axisLine: { lineStyle: { color: "#334155" } },
      axisLabel: { color: "#cbd5e1", rotate: 25, fontSize: 11 },
    },
    yAxis: {
      type: "value",
      scale: true,
      splitLine: { lineStyle: { color: "#1e293b", type: "dashed" } },
      axisLabel: { color: "#94a3b8", formatter: (v: number) => `$${v.toLocaleString()}` },
    },
    series: [
      {
        name: "Auxiliary",
        type: "bar",
        stack: "all",
        itemStyle: { borderColor: "transparent", color: "transparent" },
        emphasis: { itemStyle: { borderColor: "transparent", color: "transparent" } },
        data: wfAux,
      },
      {
        name: "Positive Driver",
        type: "bar",
        stack: "all",
        data: wfPos,
        itemStyle: { color: "#10b981", borderRadius: 4 },
        label: { show: true, position: "top", color: "#10b981", formatter: (p: any) => p.value ? `+${p.value}` : "" },
      },
      {
        name: "Negative Driver",
        type: "bar",
        stack: "all",
        data: wfNeg,
        itemStyle: { color: "#ef4444", borderRadius: 4 },
        label: { show: true, position: "bottom", color: "#ef4444", formatter: (p: any) => p.value ? `-${p.value}` : "" },
      },
      {
        name: "Total Valuation",
        type: "bar",
        stack: "all",
        data: wfTotals,
        itemStyle: { color: "#38bdf8", borderRadius: 4 },
        label: { show: true, position: "top", color: "#38bdf8", formatter: (p: any) => p.value ? `$${p.value}` : "" },
      },
    ],
  };

  return (
    <Card className="w-full mt-6 bg-slate-900/90 border-slate-800">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-teal-400" />
          <div>
            <CardTitle className="text-base">Explainable AI (XAI) & SHAP Attribution Analysis</CardTitle>
            <p className="text-xs text-slate-400">Demystifying model intelligence: exact contribution of technicals, econometrics & sentiment</p>
          </div>
        </div>

        {/* Mode switcher buttons */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setViewMode("waterfall")}
            className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${
              viewMode === "waterfall"
                ? "bg-teal-500 text-white shadow font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Waterfall Drivers
          </button>
          <button
            onClick={() => setViewMode("importance")}
            className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${
              viewMode === "importance"
                ? "bg-teal-500 text-white shadow font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Global Ranking
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Chart */}
        <div className="lg:col-span-2">
          {viewMode === "waterfall" ? (
            <ReactECharts option={wfOption} style={{ height: "350px", width: "100%" }} />
          ) : (
            <ReactECharts option={impOption} style={{ height: "350px", width: "100%" }} />
          )}
        </div>

        {/* Right Column: AI Text Explanation & Top Catalyst Badges */}
        <div className="flex flex-col justify-between bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
          <div>
            <h4 className="text-sm font-semibold text-white flex items-center gap-1.5 mb-2">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span>Why Did AI Predict This Price?</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {local_explanation}
            </p>

            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold uppercase text-slate-400 block">Top Predictive Catalysts:</span>
              {Object.entries(top_features).slice(0, 4).map(([feat, val], index) => (
                <div key={feat} className="flex items-center justify-between p-2 rounded bg-slate-800/60 border border-slate-700/50 text-xs">
                  <span className="font-medium text-slate-200">{feat.replace("_", " ").toUpperCase()}</span>
                  <span className="font-mono text-emerald-400 font-bold">{(val * 100).toFixed(1)}% weight</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-slate-400 italic">
            *SHAP (SHapley Additive exPlanations) guarantees mathematically theoretically consistent feature credit assignment across tree & neural predictors.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
