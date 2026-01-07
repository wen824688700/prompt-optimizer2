"""
Google Gemini API 服务
"""
import httpx
from typing import List, Dict, Optional
import logging
from .base_llm import BaseLLMService

logger = logging.getLogger(__name__)


class GeminiService(BaseLLMService):
    """Google Gemini API 服务"""
    
    def __init__(self, api_key: str, base_url: str = "https://generativelanguage.googleapis.com"):
        self.api_key = api_key
        self.base_url = base_url
        self.model = "gemini-3-pro-preview"  # 使用 Gemini 3 Pro Preview 模型
        self.client = httpx.AsyncClient(
            timeout=60.0,
            headers={
                "Content-Type": "application/json"
            }
        )
    
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
        try:
            prompt = f"""你是一个 Prompt 工程专家。请分析用户的需求，从以下框架列表中选择 1-3 个最合适的框架。

框架列表：
{frameworks_context}

用户需求：
{user_input}

请仅返回 1-3 个最合适的框架 ID（用逗号分隔），不要包含其他内容。
例如：RACEF,Chain-of-Thought"""

            # Gemini API 请求格式
            url = f"{self.base_url}/v1beta/models/{self.model}:generateContent?key={self.api_key}"
            
            response = await self.client.post(
                url,
                json={
                    "contents": [{
                        "parts": [{
                            "text": prompt
                        }]
                    }],
                    "generationConfig": {
                        "temperature": 0.3,
                        "maxOutputTokens": 100,
                    }
                }
            )
            
            response.raise_for_status()
            result = response.json()
            
            # 解析 Gemini 响应格式
            content = result["candidates"][0]["content"]["parts"][0]["text"].strip()
            framework_ids = [fid.strip() for fid in content.split(",")]
            
            # 确保返回 1-3 个框架
            framework_ids = framework_ids[:3]
            
            logger.info(f"Gemini analyzed intent for input: {user_input[:50]}... -> {framework_ids}")
            return framework_ids
            
        except httpx.HTTPError as e:
            logger.error(f"Gemini HTTP error during intent analysis: {e}")
            # 如果是网络问题，提供更友好的错误信息
            if "ConnectError" in str(type(e)) or "TimeoutException" in str(type(e)):
                raise Exception("无法连接到 Gemini API，可能需要配置代理或检查网络连接")
            raise Exception(f"Gemini API 调用失败: {str(e)}")
        except Exception as e:
            logger.error(f"Gemini error during intent analysis: {e}")
            raise Exception(f"意图分析失败: {str(e)}")
    
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
        try:
            # 构建系统提示
            system_instruction = f"""你是一个专业的 Prompt 工程师。请根据以下框架文档和用户提供的信息，生成一个优化后的提示词。

框架文档：
{framework_doc}

请严格按照框架文档中的结构和最佳实践来生成提示词：
1. 仔细阅读框架的"框架构成"部分，了解每个组成部分的作用
2. 参考"最佳实践"中的示例，学习如何应用框架
3. 确保生成的提示词包含框架的所有必要组成部分
4. 使用清晰的 Markdown 格式，包含适当的标题和结构
5. 根据框架特点，生成具体、可执行的提示词

生成的提示词应该：
- 结构清晰，遵循框架的组成部分
- 包含所有必要的上下文信息
- 具体明确，避免模糊表述
- 易于理解和执行
- 符合框架的最佳实践"""

            # 构建用户提示
            user_prompt = f"""用户原始需求：
{user_input}

追问信息：
- 目标清晰度：{clarification_answers.get('goalClarity', '未提供')}
- 目标受众：{clarification_answers.get('targetAudience', '未提供')}
- 上下文完整性：{clarification_answers.get('contextCompleteness', '未提供')}
- 格式要求：{clarification_answers.get('formatRequirements', '未提供')}
- 约束条件：{clarification_answers.get('constraints', '未提供')}"""

            if attachment_content:
                user_prompt += f"\n\n参考附件内容：\n{attachment_content}"

            user_prompt += "\n\n请基于上述框架文档和用户信息，生成一个完整的、优化后的提示词（使用 Markdown 格式）："

            # Gemini API 请求格式（带系统指令）
            url = f"{self.base_url}/v1beta/models/{self.model}:generateContent?key={self.api_key}"
            
            response = await self.client.post(
                url,
                json={
                    "system_instruction": {
                        "parts": [{
                            "text": system_instruction
                        }]
                    },
                    "contents": [{
                        "parts": [{
                            "text": user_prompt
                        }]
                    }],
                    "generationConfig": {
                        "temperature": 0.7,
                        "maxOutputTokens": 3000,
                    }
                }
            )
            
            response.raise_for_status()
            result = response.json()
            
            # 解析 Gemini 响应格式
            generated_prompt = result["candidates"][0]["content"]["parts"][0]["text"].strip()
            
            logger.info(f"Gemini generated prompt for input: {user_input[:50]}...")
            return generated_prompt
            
        except httpx.HTTPError as e:
            logger.error(f"Gemini HTTP error during prompt generation: {e}")
            if "ConnectError" in str(type(e)) or "TimeoutException" in str(type(e)):
                raise Exception("无法连接到 Gemini API，可能需要配置代理或检查网络连接")
            raise Exception(f"Gemini API 调用失败: {str(e)}")
        except Exception as e:
            logger.error(f"Gemini error during prompt generation: {e}")
            raise Exception(f"提示词生成失败: {str(e)}")
    
    async def close(self):
        """关闭 HTTP 客户端"""
        await self.client.aclose()
