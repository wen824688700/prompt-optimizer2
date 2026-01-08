from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str | None = None

    # DeepSeek API
    deepseek_api_key: str | None = None
    deepseek_base_url: str = "https://api.deepseek.com"

    # Google Gemini API
    gemini_api_key: str | None = None
    gemini_base_url: str = "https://generativelanguage.googleapis.com"

    # Supabase
    supabase_url: str | None = None
    supabase_key: str | None = None

    # Creem Payment
    creem_api_key: str | None = None
    creem_webhook_secret: str | None = None

    # JWT
    jwt_secret: str | None = None
    jwt_algorithm: str = "HS256"
    jwt_expiration_days: int = 7

    # Sentry
    sentry_dsn: str | None = None

    # Environment
    environment: str = "development"
    
    # 开发模式（跳过数据库连接和认证）
    dev_mode: bool = False

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()

