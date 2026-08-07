"use client";
import React, { useState, useEffect } from "react";
import { useStockStore } from "@/store/useStockStore";
import { stockApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PredictionHorizon } from "@/types/stock";
import { Search, Activity, TrendingUp, Sparkles, RefreshCw, ShieldCheck } from "lucide-react";

export function TickerSearchBar() {
  const {
    selectedTicker,
    selectedHorizon,
    isLoading,
    setTicker,
    setHorizon,
    fetchAnalysis,
  } = useStockStore();

  const [searchQuery, setSearchQuery] = useState(selectedTicker);
  const [suggestions, setSuggestions] = useState<Array<{ symbol: string; name: string; industry: string; exchange: string }>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Strictly short-term horizons to maximize institutional statistical precision
  const predictionHorizons: PredictionHorizon[] = [1, 5, 10];

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!isOpen) return;
      setIsSearching(true);
      try {
        const results = await stockApi.searchTickers(searchQuery);
        setSuggestions(results);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery, isOpen]);

  return (
    <div className="w-full bg-slate-900/95 border-b border-slate-800 backdrop-blur-md px-6 py-4 sticky top-0 z-50 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Logo & Institutional Branding */}
        <div className="flex items-center gap-3 self-start lg:self-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold text-xl">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent">
                AlphaVision AI
              </h1>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Professional Equities Analytics
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
              <span>Auto-ARIMA & GARCH Econometric Engine</span>
            </p>
          </div>
        </div>

        {/* Configuration Controls Bar */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          
          {/* Ticker Autocomplete Search Box */}
          <div className="relative flex-1 sm:flex-initial min-w-[250px]">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsOpen(true);
                }}
                placeholder="Search ticker (e.g., RELIANCE.NS, NVDA)..."
                className="w-full pl-9 pr-4 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold tracking-wide transition-all shadow-inner"
              />
            </div>

            {/* Suggestions Dropdown */}
            {isOpen && (
              <div
                className="absolute left-0 right-0 top-12 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl max-h-80 overflow-y-auto z-50 divide-y divide-slate-800/60"
                onMouseLeave={() => setIsOpen(false)}
              >
                {isSearching && <div className="p-3 text-xs text-slate-400 text-center">Searching real-time registry...</div>}
                {!isSearching && suggestions.length === 0 && (
                  <div className="p-3 text-xs text-slate-400 text-center">No symbols found. Type custom ticker and hit Analyze.</div>
                )}
                {suggestions.map((item) => (
                  <div
                    key={item.symbol}
                    onClick={() => {
                      setTicker(item.symbol, item.name);
                      setSearchQuery(item.symbol);
                      setIsOpen(false);
                    }}
                    className="p-3 hover:bg-emerald-500/15 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-mono font-bold text-sm text-emerald-400">{item.symbol}</div>
                      <div className="text-xs text-slate-200 font-medium truncate max-w-[190px]">{item.name}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase font-mono border border-slate-700">
                        {item.exchange}
                      </span>
                      <div className="text-[11px] text-slate-400 mt-1">{item.industry}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Prediction Horizon Selector (1D default, up to 10D maximum) */}
          <div className="flex items-center bg-slate-800/90 p-1 rounded-lg border border-slate-700/80 shadow-inner">
            <span className="text-xs text-slate-300 font-semibold px-2 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Target Horizon:
            </span>
            {predictionHorizons.map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`text-xs px-3 py-1.5 rounded-md font-mono font-bold transition-all ${
                  selectedHorizon === h
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30 ring-1 ring-emerald-400/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-750"
                }`}
              >
                {h === 1 ? "1D (Next Day)" : `${h}D`}
              </button>
            ))}
          </div>

          {/* Clean Corporate Action Button */}
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setIsOpen(false);
              fetchAnalysis();
            }}
            disabled={isLoading || !searchQuery.trim()}
            className="font-bold whitespace-nowrap px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 rounded-lg transition-all"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white mr-2" />
                <span>Processing Econometric Pipeline...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white fill-white mr-2" />
                <span>Analyze Stock</span>
              </>
            )}
          </Button>

        </div>
      </div>
    </div>
  );
}
