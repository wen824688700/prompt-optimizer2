"""
LLM 服务工厂
根据模型类型创建相应的 LLM 服务实例
"""
from typing import Optional
from .base_llm import BaseLLMService
from .llm_service import DeepSeekService
from .gemini_service import GeminiService
from ..config import Settings


class LLMFactory:
    """LLM 服务工厂类"""
    
    @staticmethod
    def create_service(model: str, settings: Settings) -> BaseLLMService:
        """
        根据模型类型创建 LLM 服务实例
        
        Args:
            model: 模型标识符 ('deepseek' 或 'gemini')
            settings: 应用配置
        
        Returns:
            BaseLLMService 实例
        
        Raises:
            ValueError: 不支持的模型类型
        """
        model = model.lower()
        
        if model == 'deepseek':
            return DeepSeekService(
                api_key=settings.deepseek_api_key,
                base_url=settings.deepseek_base_url
            )
        elif model == 'gemini':
            return GeminiService(
                api_key=settings.gemini_api_key,
                base_url=settings.gemini_base_url
            )
        else:
            raise ValueError(f"不支持的模型类型: {model}。支持的模型: deepseek, gemini")
    
    @staticmethod
    def get_supported_models():
        """获取支持的模型列表"""
        return ['deepseek', 'gemini']
