import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "AlphaVision AI | AI-Powered Stock Forecasting & RAG Intelligence",
  description: "Institutional multi-model machine learning equity forecasting (LSTM, GRU, XGBoost, CatBoost) with OpenRouter GPT-5.5 sentiment analysis and grounded RAG financial chat.",
  keywords: "Stock Market, AI Forecasting, Quantitative Trading, NIFTY 50, NASDAQ, SHAP Explainability, RAG Financial Analyst, Next.js 15, FastAPI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${inter.variable} font-sans bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-white`}>
        {children}
      </body>
    </html>
  );
}
