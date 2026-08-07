import axios from "axios";
import { StockAnalysisResponse, TrainWindow, PredictionHorizon } from "@/types/stock";

const isProd = process.env.NODE_ENV === "production";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (isProd ? "/api" : "http://localhost:8000/api");

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const stockApi = {
  searchTickers: async (query: string): Promise<Array<{ symbol: string; name: string; industry: string; exchange: string }>> => {
    const response = await apiClient.get("/stocks/search", { params: { query } });
    return response.data;
  },

  runAnalysis: async (
    ticker: string,
    window: TrainWindow = "Last 1 year",
    horizon: PredictionHorizon = 15,
    startDate?: string,
    endDate?: string
  ): Promise<StockAnalysisResponse> => {
    const params: Record<string, any> = {
      ticker,
      window,
      horizon,
    };
    if (window === "Custom date range" && startDate && endDate) {
      params.start_date = startDate;
      params.end_date = endDate;
    }
    const response = await apiClient.post<StockAnalysisResponse>("/analysis/run", null, { params });
    return response.data;
  },

  sendChatQuery: async (
    ticker: string,
    query: string,
    history: Array<{ role: string; content: string }> = []
  ): Promise<{ answer: string; grounding_sources: string[]; model_used: string }> => {
    const response = await apiClient.post("/chat", {
      ticker,
      query,
      history,
    });
    return response.data;
  },
};
