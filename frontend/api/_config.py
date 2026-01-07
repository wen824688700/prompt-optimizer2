"""
Vercel Serverless Functions 配置模块
用于在无状态环境中管理配置和依赖
"""
import os
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """应用配置"""
    # Database
    database_url: str
    
    # DeepSeek API
    deepseek_api_key: str
    deepseek_base_url: str = "https://api.deepseek.com"
    
    # Google Gemini API
    gemini_api_key: str
    gemini_base_url: str = "https://generativelanguage.googleapis.com"
    
    # Supabase
    supabase_url: str
    supabase_key: str
    
    # Creem Payment
    creem_api_key: str
    creem_webhook_secret: str
    
    # JWT
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expiration_days: int = 7
    
    # Environment
    environment: str = "production"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """获取配置单例"""
    return Settings()


# 全局服务实例缓存（用于 Serverless 函数间复用）
_service_cache = {}


def get_cached_service(key: str, factory_func):
    """
    获取缓存的服务实例
    
    Args:
        key: 缓存键
        factory_func: 工厂函数，用于创建服务实例
    
    Returns:
        服务实例
    """
    global _service_cache
    if key not in _service_cache:
        _service_cache[key] = factory_func()
    return _service_cache[key]
