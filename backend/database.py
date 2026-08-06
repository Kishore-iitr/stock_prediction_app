import time
import json
import asyncio
from typing import Any, Optional, Dict
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import create_engine
import redis
from config import settings

Base = declarative_base()

# 1. Database Setup (Async Support with SQLite Fallback)
try:
    if settings.database_url and not settings.database_url.startswith("sqlite"):
        async_engine = create_async_engine(settings.database_url, echo=False, future=True)
    else:
        # SQLite Async fallback
        async_engine = create_async_engine("sqlite+aiosqlite:///./stock_analytics.db", echo=False, future=True)
    AsyncSessionLocal = async_sessionmaker(bind=async_engine, expire_on_commit=False, class_=AsyncSession)
except Exception as e:
    print(f"[Warning] Database initialization issue, falling back to local SQLite: {e}")
    async_engine = create_async_engine("sqlite+aiosqlite:///./stock_analytics.db", echo=False, future=True)
    AsyncSessionLocal = async_sessionmaker(bind=async_engine, expire_on_commit=False, class_=AsyncSession)

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def init_db():
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# 2. Caching Layer (Redis with In-Memory TTL Fallback)
class CacheManager:
    def __init__(self):
        self._redis_client: Optional[redis.Redis] = None
        self._memory_cache: Dict[str, Dict[str, Any]] = {}
        
        if settings.redis_url:
            try:
                self._redis_client = redis.from_url(settings.redis_url, decode_responses=True, socket_timeout=1)
                self._redis_client.ping()
                print("[Cache] Connected to Redis cache successfully.")
            except Exception as e:
                print(f"[Cache] Redis unavailable ({e}). Falling back to In-Memory TTL Cache.")
                self._redis_client = None
        else:
            print("[Cache] No REDIS_URL provided. Using In-Memory TTL Cache.")

    def get(self, key: str) -> Optional[Any]:
        # Try Redis first
        if self._redis_client:
            try:
                val = self._redis_client.get(key)
                if val is not None:
                    return json.loads(val)
            except Exception:
                pass # Fallback to memory check
        
        # Memory TTL cache check
        if key in self._memory_cache:
            item = self._memory_cache[key]
            if time.time() < item["expires_at"]:
                return item["data"]
            else:
                del self._memory_cache[key] # Expired
        return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        if ttl is None:
            ttl = settings.cache_ttl_seconds
            
        json_val = json.dumps(value)
        if self._redis_client:
            try:
                self._redis_client.setex(key, ttl, json_val)
                return
            except Exception:
                pass # Fallback to memory
                
        # Save to memory cache
        self._memory_cache[key] = {
            "data": value,
            "expires_at": time.time() + ttl
        }

    def delete(self, key: str):
        if self._redis_client:
            try:
                self._redis_client.delete(key)
            except Exception:
                pass
        if key in self._memory_cache:
            del self._memory_cache[key]

    def clear(self):
        if self._redis_client:
            try:
                self._redis_client.flushdb()
            except Exception:
                pass
        self._memory_cache.clear()

cache = CacheManager()
