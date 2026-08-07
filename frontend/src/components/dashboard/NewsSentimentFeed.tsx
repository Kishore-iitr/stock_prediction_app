"use client";
import React, { useState } from "react";
import { useStockStore } from "@/store/useStockStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Newspaper, MessageSquareQuote, ShieldAlert, Sparkles, ExternalLink, Flame, TrendingDown, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";

export function NewsSentimentFeed() {
  const { analysisData } = useStockStore();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  if (!analysisData || !analysisData.news_sentiment) {
    return null;
  }

  const {
    overall_sentiment_score,
    classification,
    articles,
    aggregated_risks,
    aggregated_opportunities,
    llm_model_used,
  } = analysisData.news_sentiment;

  const getSentimentBadge = (sent: string) => {
    if (sent.includes("Bullish")) return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40";
    if (sent.includes("Bearish")) return "bg-rose-500/20 text-rose-400 border border-rose-500/40";
    return "bg-slate-700 text-slate-300 border border-slate-600";
  };

  // Calculate gauge bar width (-100 to +100 normalized to 0 - 100%)
  const normalizedScore = Math.min(100, Math.max(0, (overall_sentiment_score + 100) / 2));

  return (
    <div className="space-y-6 mt-6">
      
      {/* Macro Sentiment Overview Banner */}
      <Card className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border-slate-800">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Newspaper className="w-5 h-5 text-indigo-400" />
                <span className="text-xs font-mono text-indigo-400 uppercase tracking-wide">Multi-Source Financial Intelligence (30-Day Window)</span>
              </div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                OpenRouter LLM Sentiment Consensus: <span className="text-emerald-400 font-mono">{classification}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Synthesizing articles from Reuters, Yahoo Finance, Economic Times & PR Newswire. Evaluated by: <code className="text-sky-300 font-semibold">{llm_model_used}</code>
              </p>
            </div>

            {/* Sentiment Score Bar Gauge */}
            <div className="w-full md:w-80 bg-slate-950/90 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="text-rose-400">-100 (Bearish)</span>
                <span className="text-white font-bold text-sm">Score: {overall_sentiment_score > 0 ? `+${overall_sentiment_score}` : overall_sentiment_score}</span>
                <span className="text-emerald-400">+100 (Bullish)</span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden relative border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 transition-all duration-700 rounded-full"
                  style={{ width: `${normalizedScore}%` }}
                />
              </div>
            </div>

          </div>

          {/* Aggregated Risks & Opportunities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-800/60">
            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
              <span className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-1.5 mb-2">
                <Flame className="w-4 h-4 text-emerald-400" /> Strategic Growth Opportunities
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {aggregated_opportunities.map((opp, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>{opp}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
              <span className="text-xs font-bold text-amber-400 uppercase flex items-center gap-1.5 mb-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" /> Macro & Operational Risk Alerts
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {aggregated_risks.map((risk, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400">⚠</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Articles Feed */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2 px-1">
          <MessageSquareQuote className="w-4 h-4 text-teal-400" />
          <span>Deduplicated Financial News Feed ({articles.length} Articles Analyzed)</span>
        </h4>

        {articles.map((art, idx) => {
          const isExpanded = expandedIndex === idx;
          return (
            <Card key={idx} className="bg-slate-900/80 hover:bg-slate-900 border-slate-800/80 transition-all">
              <div
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400 font-mono">
                    <span className="text-sky-400 font-semibold">{art.source}</span>
                    <span>•</span>
                    <span>{art.publication_date}</span>
                  </div>
                  <h5 className="text-sm font-bold text-white hover:text-emerald-300 transition-colors">
                    {art.headline}
                  </h5>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className={`text-[11px] px-2.5 py-1 rounded-full font-mono font-semibold uppercase ${getSentimentBadge(art.sentiment)}`}>
                    {art.sentiment} ({(art.confidence * 100).toFixed(0)}%)
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </div>

              {/* Expandable Deep Content */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-slate-800/60 bg-slate-950/40 text-xs text-slate-300 space-y-3">
                  <div>
                    <span className="font-semibold text-slate-400 block mb-1">AI Analytical Summary:</span>
                    <p className="leading-relaxed">{art.explanation || art.summary}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {art.opportunities.length > 0 && (
                      <div className="bg-emerald-500/5 p-2.5 rounded border border-emerald-500/20">
                        <span className="text-emerald-400 font-semibold block mb-1">Catalysts / Opportunities:</span>
                        <ul className="list-disc pl-4 space-y-1 text-slate-300">
                          {art.opportunities.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                      </div>
                    )}
                    {art.key_risks.length > 0 && (
                      <div className="bg-rose-500/5 p-2.5 rounded border border-rose-500/20">
                        <span className="text-rose-400 font-semibold block mb-1">Potential Headwinds:</span>
                        <ul className="list-disc pl-4 space-y-1 text-slate-300">
                          {art.key_risks.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>

                  {art.url && (
                    <div className="pt-1 text-right">
                      <a
                        href={art.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-400 hover:underline inline-flex items-center gap-1 text-[11px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>Read original full source publication</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
