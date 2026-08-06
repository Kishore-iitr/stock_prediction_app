import os
from typing import List, Dict, Any
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    # App Settings
    app_title: str = "AlphaVision AI Quant & Equities Forecasting API"
    app_url: str = "http://localhost:3000"
    debug: bool = True
    
    # 1. Conduit API LLM Settings (Primary Gateway)
    conduit_api_key: str = Field(default="", env="CONDUIT_API_KEY")
    conduit_base_url: str = Field(default="https://conduit.ozdoev.net/v1", env="CONDUIT_BASE_URL")
    conduit_models_str: str = Field(
        default="openai/gpt-5.5-preview,openai/gpt-5.5,gpt-4o,anthropic/claude-3-5-sonnet,meta-llama/llama-3.3-70b-instruct",
        env="CONDUIT_MODELS"
    )

    # 2. OpenRouter LLM Settings (Secondary Fallback)
    openrouter_api_key: str = Field(default="", env="OPENROUTER_API_KEY")
    openrouter_base_url: str = Field(default="https://openrouter.ai/api/v1", env="OPENROUTER_BASE_URL")
    openrouter_models_str: str = Field(
        default="openai/gpt-5.5-preview,openai/gpt-5.5,openai/gpt-4o,anthropic/claude-3.5-sonnet,meta-llama/llama-3.3-70b-instruct",
        env="OPENROUTER_MODELS"
    )
    
    # Database & Caching (with zero-setup fallback)
    database_url: str = Field(default="sqlite+aiosqlite:///./stock_analytics.db", env="DATABASE_URL")
    redis_url: str = Field(default="", env="REDIS_URL")
    cache_ttl_seconds: int = Field(default=3600, env="CACHE_TTL_SECONDS")
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )
    
    @property
    def get_openrouter_models(self) -> List[str]:
        """Legacy helper for fallback list of OpenRouter models."""
        models = [m.strip() for m in self.openrouter_models_str.split(",") if m.strip()]
        if not models:
            return ["openai/gpt-5.5-preview", "openai/gpt-5.5", "openai/gpt-4o"]
        return models

    def get_llm_endpoints(self) -> List[Dict[str, Any]]:
        """
        Returns an ordered list of LLM gateways and models to try with automatic cascade fallback:
        1. Conduit API (https://conduit.ozdoev.net/v1) -> Tries GPT-5.5, GPT-4o, Claude fallbacks.
        2. OpenRouter API (https://openrouter.ai/api/v1) -> Tries fallback models if Conduit fails.
        """
        endpoints = []
        
        # 1. Check Conduit API Key
        c_key = self.conduit_api_key.strip()
        if c_key and c_key not in ["your_conduit_api_key_here", ""]:
            models = [m.strip() for m in self.conduit_models_str.split(",") if m.strip()]
            endpoints.append({
                "provider": "Conduit",
                "base_url": self.conduit_base_url.rstrip("/") + "/chat/completions",
                "api_key": c_key,
                "models": models
            })
            
        # 2. Check OpenRouter API Key
        or_key = self.openrouter_api_key.strip()
        if or_key and or_key not in ["your_openrouter_api_key_here", ""]:
            models = [m.strip() for m in self.openrouter_models_str.split(",") if m.strip()]
            endpoints.append({
                "provider": "OpenRouter",
                "base_url": self.openrouter_base_url.rstrip("/") + "/chat/completions",
                "api_key": or_key,
                "models": models
            })
            
        return endpoints

settings = Settings()

# Make sure a local .env exists by copying .env.example if missing
if not os.path.exists(".env") and os.path.exists(".env.example"):
    try:
        import shutil
        shutil.copy(".env.example", ".env")
    except Exception:
        pass
