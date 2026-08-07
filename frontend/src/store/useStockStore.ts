import { create } from "zustand";
import { StockAnalysisResponse, TrainWindow, PredictionHorizon, ChatMessage } from "@/types/stock";
import { stockApi } from "@/lib/api";

interface StockStore {
  selectedTicker: string;
  companyName: string;
  selectedWindow: TrainWindow;
  customStartDate: string;
  customEndDate: string;
  selectedHorizon: PredictionHorizon;
  
  isLoading: boolean;
  error: string | null;
  analysisData: StockAnalysisResponse | null;
  activeTab: "overview" | "forecast" | "shap" | "models" | "news" | "chat";
  
  chatMessages: ChatMessage[];
  isChatLoading: boolean;

  setTicker: (ticker: string, name?: string) => void;
  setWindow: (window: TrainWindow) => void;
  setCustomDateRange: (start: string, end: string) => void;
  setHorizon: (horizon: PredictionHorizon) => void;
  setActiveTab: (tab: "overview" | "forecast" | "shap" | "models" | "news" | "chat") => void;
  
  fetchAnalysis: () => Promise<void>;
  sendChatMessage: (text: string) => Promise<void>;
}

export const useStockStore = create<StockStore>((set, get) => ({
  selectedTicker: "RELIANCE.NS",
  companyName: "Reliance Industries Limited",
  selectedWindow: "Last 1 year",
  customStartDate: "",
  customEndDate: "",
  selectedHorizon: 1,

  isLoading: false,
  error: null,
  analysisData: null,
  activeTab: "overview",

  chatMessages: [
    {
      id: "init-1",
      sender: "ai",
      text: "Hello! I am your AlphaVision AI Financial Analyst powered by OpenRouter & Conduit (GPT-5.5 / Multi-LLM fallback). Our institutional pipeline specializes in highly reliable Next-Day and short-term equities forecasting. Ask me anything about price drivers, GARCH risk bounds, news sentiment consensus, or compare with industry peers!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ],
  isChatLoading: false,

  setTicker: (ticker, name) => {
    set({ selectedTicker: ticker.toUpperCase(), companyName: name || ticker.toUpperCase() });
  },
  setWindow: (window) => set({ selectedWindow: window }),
  setCustomDateRange: (start, end) => set({ customStartDate: start, customEndDate: end }),
  setHorizon: (horizon) => set({ selectedHorizon: horizon }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  fetchAnalysis: async () => {
    const { selectedTicker, selectedWindow, selectedHorizon, customStartDate, customEndDate } = get();
    set({ isLoading: true, error: null });
    try {
      const data = await stockApi.runAnalysis(
        selectedTicker,
        selectedWindow,
        selectedHorizon,
        customStartDate || undefined,
        customEndDate || undefined
      );
      set({
        analysisData: data,
        companyName: data.metadata.company_name || selectedTicker,
        isLoading: false,
      });
    } catch (err: any) {
      console.error("Failed analysis run:", err);
      set({
        isLoading: false,
        error: err?.response?.data?.detail || err?.message || "Failed to retrieve AI analysis pipeline results.",
      });
    }
  },

  sendChatMessage: async (text: string) => {
    const { selectedTicker, chatMessages } = get();
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    set({ chatMessages: [...chatMessages, userMsg], isChatLoading: true });

    try {
      const history = chatMessages.map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      }));
      
      const res = await stockApi.sendChatQuery(selectedTicker, text, history);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: res.answer,
        sources: res.grounding_sources,
        modelUsed: res.model_used,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      set((state) => ({
        chatMessages: [...state.chatMessages, aiMsg],
        isChatLoading: false,
      }));
    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: "ai",
        text: "My conversational engine faced an interruption communicating with the backend. Please ensure the FastAPI service is reachable.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      set((state) => ({
        chatMessages: [...state.chatMessages, errorMsg],
        isChatLoading: false,
      }));
    }
  },
}));
