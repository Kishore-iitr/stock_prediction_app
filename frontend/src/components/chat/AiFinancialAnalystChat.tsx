"use client";
import React, { useState, useRef, useEffect } from "react";
import { useStockStore } from "@/store/useStockStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, Bot, User, Sparkles, RefreshCw, BookOpen, ShieldAlert, MessageSquare } from "lucide-react";

export function AiFinancialAnalystChat() {
  const { selectedTicker, companyName, chatMessages, isChatLoading, sendChatMessage, analysisData } = useStockStore();
  const [inputQuery, setInputQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    `Why did AI rate ${selectedTicker} as ${analysisData?.investment_recommendation.recommendation || "a Buy"}?`,
    `What are the major upside opportunities and headwinds?`,
    `Explain the SHAP top feature drivers for this stock.`,
    `How does GARCH volatility affect the confidence interval?`,
    `Compare with sector competitors and NIFTY benchmarks.`
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isChatLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isChatLoading) return;
    const q = inputQuery;
    setInputQuery("");
    sendChatMessage(q);
  };

  return (
    <Card className="w-full mt-6 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-slate-800 flex flex-col h-[650px] shadow-2xl">
      
      {/* Header */}
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800/80 bg-slate-900/90 rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <span>AlphaVision AI RAG Conversational Analyst</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono font-bold">
                GROUNDED IN-MEMORY RAG
              </span>
            </CardTitle>
            <p className="text-xs text-slate-400">
              Direct conversational access to {companyName} ({selectedTicker}) quantitative pipeline, news sentiment, & technical formulas
            </p>
          </div>
        </div>
      </CardHeader>

      {/* Message Chat Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 divide-y divide-transparent">
        {chatMessages.map((msg) => {
          const isAi = msg.sender === "ai";
          return (
            <div key={msg.id} className={`flex items-start gap-4 ${isAi ? "" : "flex-row-reverse"}`}>
              
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
                  isAi ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white" : "bg-slate-700 text-slate-200"
                }`}
              >
                {isAi ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>

              <div
                className={`max-w-[80%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  isAi
                    ? "bg-slate-800/80 border border-slate-700/80 text-slate-100 shadow-lg rounded-tl-none"
                    : "bg-emerald-600/90 text-white font-medium rounded-tr-none shadow-md shadow-emerald-600/20"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Grounding Sources tags if present */}
                {isAi && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                    <BookOpen className="w-3.5 h-3.5 text-teal-400 mr-1" />
                    <span>RAG Grounding Citations:</span>
                    {msg.sources.map((src, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-slate-900/90 text-teal-300 border border-slate-700">
                        {src}
                      </span>
                    ))}
                    {msg.modelUsed && (
                      <span className="ml-auto text-slate-500">
                        Engine: {msg.modelUsed}
                      </span>
                    )}
                  </div>
                )}
              </div>

            </div>
          );
        })}

        {isChatLoading && (
          <div className="flex items-center gap-3 text-xs text-slate-400 pl-2 font-mono animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Antigravity AI is reasoning across real-time market vector embeddings...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Carousel/Pills */}
      <div className="px-6 py-2 bg-slate-950/60 border-t border-slate-800/60 overflow-x-auto flex items-center gap-2">
        <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1 whitespace-nowrap">
          <Sparkles className="w-3 h-3 text-amber-400" /> Try Asking:
        </span>
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => sendChatMessage(p)}
            disabled={isChatLoading}
            className="text-xs px-3 py-1.5 rounded-full bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40 border border-slate-700 text-slate-300 transition-all whitespace-nowrap"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="p-4 bg-slate-900 border-t border-slate-800 rounded-b-xl flex items-center gap-3">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={`Ask Antigravity Financial Analyst anything about ${companyName} (${selectedTicker})...`}
          disabled={isChatLoading}
          className="flex-1 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
        />
        <Button
          type="submit"
          disabled={isChatLoading || !inputQuery.trim()}
          variant="primary"
          className="px-6 h-12 rounded-xl shadow-lg shadow-emerald-500/30 font-bold flex items-center gap-2"
        >
          <span>Send Inquiry</span>
          <Send className="w-4 h-4" />
        </Button>
      </form>

    </Card>
  );
}
