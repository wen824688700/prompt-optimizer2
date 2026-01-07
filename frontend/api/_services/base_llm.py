"""
基础 LLM 服务接口
定义所有 LLM 服务必须实现的方法
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Optional


class BaseLLMService(ABC):
    """LLM 服务的抽象基类"""
    
    @abstractmethod
    async def analyze_intent(
        self, 
        user_input: str, 
        frameworks_context: str
    ) -> List[str]:
        """
        分析用户意图并返回推荐的框架 ID
        
        Args:
            user_input: 用户输入的原始提示词或需求
            frameworks_context: 框架映射表上下文（Frameworks_Summary.md）
        
        Returns:
            1-3 个框架 ID 列表
        """
        pass
    
    @abstractmethod
    async def generate_prompt(
        self,
        user_input: str,
        framework_doc: str,
        clarification_answers: Dict[str, str],
        attachment_content: Optional[str] = None
    ) -> str:
        """
        生成优化后的提示词
        
        Args:
            user_input: 用户原始输入
            framework_doc: 完整的框架文档
            clarification_answers: 追问问题的答案
            attachment_content: 附件内容（可选）
        
        Returns:
            优化后的 Markdown 格式提示词
        """
        pass
    
    @abstractmethod
    async def close(self):
        """关闭客户端连接"""
        pass
