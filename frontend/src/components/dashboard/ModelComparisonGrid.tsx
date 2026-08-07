"use client";
import React from "react";
import { useStockStore } from "@/store/useStockStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Trophy, CheckCircle, Cpu, BarChart2, Zap } from "lucide-react";

export function ModelComparisonGrid() {
  const { analysisData } = useStockStore();

  if (!analysisData || !analysisData.model_comparisons.length) {
    return null;
  }

  const { model_comparisons, best_performing_model } = analysisData;

  const getCategoryBadge = (name: string) => {
    if (name.includes("LSTM") || name.includes("GRU") || name.includes("Deep Learning")) {
      return { text: "Deep Neural Network", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" };
    }
    if (name.includes("XGBoost") || name.includes("CatBoost") || name.includes("LightGBM") || name.includes("Gradient")) {
      return { text: "Gradient Boosted Trees", color: "bg-sky-500/20 text-sky-300 border-sky-500/30" };
    }
    return { text: "Ensemble Forest", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" };
  };

  return (
    <Card className="w-full mt-6 bg-slate-900/90 border-slate-800">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <Cpu className="w-6 h-6 text-emerald-400" />
          <div>
            <CardTitle className="text-base">Multi-Model Competitive Benchmarking (7 Architectures)</CardTitle>
            <p className="text-xs text-slate-400">
              Evaluated via strict time-series rolling cross-validation to eliminate data leakage & look ahead bias
            </p>
          </div>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400 fill-amber-400 animate-bounce" />
          <span className="text-xs font-medium text-slate-300">Champion Predictor:</span>
          <span className="text-xs font-bold font-mono text-emerald-400">{best_performing_model}</span>
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-6">Model Architecture</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4 text-right">R² Score (Accuracy)</th>
              <th className="py-3.5 px-4 text-right">RMSE (Error)</th>
              <th className="py-3.5 px-4 text-right">MAE</th>
              <th className="py-3.5 px-6 text-right">MAPE (%)</th>
              <th className="py-3.5 px-6 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {model_comparisons.map((model, idx) => {
              const isWinner = model.model_name === best_performing_model;
              const cat = getCategoryBadge(model.model_name);

              return (
                <tr
                  key={idx}
                  className={`transition-colors ${
                    isWinner
                      ? "bg-emerald-500/10 font-bold border-l-4 border-emerald-500 text-white"
                      : "hover:bg-slate-800/40"
                  }`}
                >
                  <td className="py-4 px-6 font-mono text-sm flex items-center gap-2">
                    {isWinner && <Trophy className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                    <span>{model.model_name}</span>
                  </td>

                  <td className="py-4 px-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${cat.color}`}>
                      {cat.text}
                    </span>
                  </td>

                  <td className={`py-4 px-4 text-right font-mono text-sm ${isWinner ? "text-emerald-400 font-bold" : "text-slate-300"}`}>
                    {model.r2_score.toFixed(3)}
                  </td>

                  <td className="py-4 px-4 text-right font-mono">
                    {model.rmse.toFixed(3)}
                  </td>

                  <td className="py-4 px-4 text-right font-mono text-slate-400">
                    {model.mae.toFixed(3)}
                  </td>

                  <td className={`py-4 px-6 text-right font-mono ${model.mape < 3 ? "text-emerald-400" : "text-amber-300"}`}>
                    {model.mape.toFixed(2)}%
                  </td>

                  <td className="py-4 px-6 text-center">
                    {isWinner ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md shadow-emerald-500/30">
                        <CheckCircle className="w-3.5 h-3.5" /> Selected Champion
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-mono">Evaluated</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        <div className="p-4 bg-slate-950/60 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80">
          <div>
            <span>*All architectures trained on 15+ Technical indicators + Econometric GARCH volatility signals.</span>
          </div>
          <div className="font-mono text-[11px]">
            Execution time: <strong className="text-teal-400">{analysisData.computation_time_seconds} seconds</strong>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
