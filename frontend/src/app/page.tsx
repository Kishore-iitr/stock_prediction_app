"use client";
import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { useStockStore } from "@/store/useStockStore";
import { TickerSearchBar } from "@/components/header/TickerSearchBar";
import { RecommendationCard } from "@/components/dashboard/RecommendationCard";
import { NewsSentimentFeed } from "@/components/dashboard/NewsSentimentFeed";
import { AiFinancialAnalystChat } from "@/components/chat/AiFinancialAnalystChat";
import { Activity, TrendingUp, Newspaper, MessageSquare, AlertCircle, RefreshCw, ShieldCheck } from "lucide-react";

// Dynamically import ECharts canvas components with ssr: false to guarantee 100% hydration perfection in Next.js
const CandlestickChart = dynamic(() => import("@/components/charts/CandlestickChart").then((mod) => mod.CandlestickChart), { ssr: false });
const ForecastChart = dynamic(() => import("@/components/charts/ForecastChart").then((mod) => mod.ForecastChart), { ssr: false });

export default function Home() {
  const { analysisData, isLoading, error, activeTab, setActiveTab, fetchAnalysis, selectedTicker } = useStockStore();

  // Auto fetch default symbol analysis upon landing
  useEffect(() => {
    if (!analysisData && !isLoading) {
      fetchAnalysis();
    }
  }, []);

  const tabs = [
    { id: "overview", label: "Executive Dashboard", icon: Activity, count: null },
    { id: "forecast", label: "Price Trajectory & Confidence Bands", icon: TrendingUp, count: `${analysisData?.horizon_days || 1}D` },
    { id: "news", label: "News Sentiment Consensus", icon: Newspaper, count: analysisData?.news_sentiment.articles_count || null },
    { id: "chat", label: "RAG AI Financial Analyst", icon: MessageSquare, count: "LLM" },
  ] as const;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 pb-20 selection:bg-emerald-500 selection:text-white font-sans">
      {/* Sticky Header with Ticker and Horizon Toggle */}
      <TickerSearchBar />

      <div className="max-w-7xl mx-auto px-6 mt-6">
        
        {/* Error Banner if API fails */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 flex items-center justify-between gap-4 mb-6 shadow-xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
              <div>
                <strong className="font-bold text-white block">Quantitative Pipeline Notification:</strong>
                <span className="text-xs text-rose-300">{error}</span>
              </div>
            </div>
            <button
              onClick={() => fetchAnalysis()}
              className="text-xs px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors shadow-md shrink-0"
            >
              Retry Pipeline
            </button>
          </div>
        )}

        {/* Institutional Processing Skeleton */}
        {isLoading && (
          <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30 animate-spin">
              <RefreshCw className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white tracking-tight">Executing Institutional Next-Day Forecasting Pipeline...</h3>
              <p className="text-xs text-slate-400 max-w-md mt-1 leading-relaxed">
                Ingesting rolling historical market prices for <strong className="text-emerald-400 font-mono">{selectedTicker}</strong>, fitting automatic ARIMA order via AIC/BIC, validating 80/20 holdout metrics, computing GARCH variance risk bands, and gathering OpenRouter news sentiment consensus.
              </p>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        {!isLoading && analysisData && (
          <div>
            
            {/* Corporate KPI Header Banner */}
            <div className="bg-slate-900/90 backdrop-blur-md rounded-xl p-5 border border-slate-800 shadow-xl mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-2xl font-black tracking-tight text-white">{analysisData.metadata.company_name}</h2>
                  <span className="text-sm px-2.5 py-0.5 rounded-md bg-slate-800 font-mono text-emerald-400 font-extrabold border border-slate-700 shadow">
                    {analysisData.metadata.ticker}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1.5 flex items-center gap-2.5 font-medium">
                  <span>Sector: <strong className="text-slate-200">{analysisData.metadata.sector || "Equities"}</strong></span>
                  <span>•</span>
                  <span>Industry: <strong className="text-slate-200">{analysisData.metadata.industry || "Capital Markets"}</strong></span>
                  <span>•</span>
                  <span>Exchange: <strong className="text-slate-200 uppercase">{analysisData.metadata.exchange || "NSE / NYSE"}</strong></span>
                  <span>•</span>
                  <span className="text-emerald-400 font-mono flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Institutional Target View</span>
                </div>
                {analysisData.data_start_date && analysisData.data_end_date && (
                  <div className="text-[11px] text-slate-500 mt-1 font-mono">
                    Data Collected: <span className="text-slate-400">{analysisData.data_start_date}</span> — <span className="text-slate-400">{analysisData.data_end_date}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-right">
                {analysisData.metadata.market_cap && (
                  <div className="bg-slate-950 px-3.5 py-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-mono block uppercase font-semibold">Market Cap</span>
                    <span className="text-sm font-mono font-bold text-white">
                      ₹{(analysisData.metadata.market_cap / 1e9).toFixed(2)}B
                    </span>
                  </div>
                )}
                {analysisData.metadata.pe_ratio && (
                  <div className="bg-slate-950 px-3.5 py-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-mono block uppercase font-semibold">P/E Ratio</span>
                    <span className="text-sm font-mono font-bold text-sky-400">
                      {analysisData.metadata.pe_ratio.toFixed(2)}x
                    </span>
                  </div>
                )}
                <div className="bg-slate-950 px-3.5 py-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block uppercase font-semibold">Primary Engine</span>
                  <span className="text-sm font-mono font-bold text-emerald-400 truncate max-w-[170px] block">
                    {analysisData.model_comparisons && analysisData.model_comparisons.length > 0 
                      ? analysisData.model_comparisons[0].model_name 
                      : analysisData.best_performing_model}
                  </span>
                </div>
                <div className="bg-slate-950 px-3.5 py-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block uppercase font-semibold">Direction & Conf.</span>
                  <span className={`text-sm font-mono font-bold ${
                    (analysisData.investment_recommendation.direction || analysisData.investment_recommendation.recommendation) === "BUY" ? "text-emerald-400" : "text-amber-400"
                  }`}>
                    {(analysisData.investment_recommendation.direction || analysisData.investment_recommendation.recommendation).toUpperCase()} ({analysisData.investment_recommendation.prediction_confidence_pct || 78}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-800/80 pb-2 mb-6 scrollbar-none">
              {tabs.map((t) => {
                const Icon = t.icon;
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-t-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-gradient-to-r from-slate-800 to-slate-850 text-emerald-400 border-b-2 border-emerald-500 shadow-md"
                        : "text-slate-400 hover:text-white hover:bg-slate-900/60"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                    <span>{t.label}</span>
                    {t.count && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        isActive ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold" : "bg-slate-800 text-slate-400"
                      }`}>
                        {t.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab 1: Executive Dashboard (Authoritative 4-Card Bloomberg UI + Charts + News) */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <RecommendationCard />
                <div className="grid grid-cols-1 gap-6">
                  <ForecastChart />
                  <CandlestickChart />
                </div>
                <NewsSentimentFeed />
              </div>
            )}

            {/* Tab 2: Institutional Price Trajectory & Confidence Bands */}
            {activeTab === "forecast" && (
              <div className="space-y-6">
                <ForecastChart />
                <CandlestickChart />
              </div>
            )}

            {/* Tab 3: News Sentiment Consensus */}
            {activeTab === "news" && (
              <div className="space-y-6">
                <NewsSentimentFeed />
              </div>
            )}

            {/* Tab 4: RAG AI Financial Analyst Chat (Powered by OpenRouter / Conduit) */}
            {activeTab === "chat" && (
              <div className="space-y-6">
                <AiFinancialAnalystChat />
              </div>
            )}

          </div>
        )}

      </div>
    </main>
  );
}
