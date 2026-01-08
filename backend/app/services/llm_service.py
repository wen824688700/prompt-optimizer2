"""
LLM Service for interacting with DeepSeek API
"""
import logging
from typing import Any

import httpx

from .base_llm import BaseLLMService

logger = logging.getLogger(__name__)


class DeepSeekService(BaseLLMService):
    """Service for interacting with DeepSeek LLM API"""

    def __init__(self, api_key: str, base_url: str = "https://api.deepseek.com"):
        self.api_key = api_key
        self.base_url = base_url
        self.client = httpx.AsyncClient(
            timeout=httpx.Timeout(120.0, connect=10.0),  # 增加超时到 120 秒
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
        )
        self.max_retries = 3  # 最大重试次数

    async def _call_api_with_retry(self, payload: dict[str, Any]) -> dict[str, Any]:
        """
        带重试机制的 API 调用

        Args:
            payload: API 请求负载

        Returns:
            API 响应 JSON

        Raises:
            Exception: API 调用失败
        """
        last_error = None

        for attempt in range(self.max_retries):
            try:
                response = await self.client.post(
                    f"{self.base_url}/v1/chat/completions",
                    json=payload
                )
                response.raise_for_status()
                return response.json()

            except (httpx.TimeoutException, httpx.NetworkError, httpx.RemoteProtocolError) as e:
                last_error = e
                logger.warning(
                    f"API 调用失败 (尝试 {attempt + 1}/{self.max_retries}): {type(e).__name__}: {str(e)}"
                )
                if attempt < self.max_retries - 1:
                    # 等待后重试（指数退避）
                    import asyncio
                    await asyncio.sleep(2 ** attempt)
                continue

            except httpx.HTTPStatusError as e:
                logger.error(f"HTTP 状态错误: {e.response.status_code} - {e.response.text}")
                raise Exception(f"LLM API 返回错误: {e.response.status_code}")

            except Exception as e:
                logger.error(f"未预期的错误: {type(e).__name__}: {str(e)}")
                raise Exception(f"LLM API 调用失败: {str(e)}")

        # 所有重试都失败
        raise Exception(f"LLM API 调用失败（已重试 {self.max_retries} 次）: {str(last_error)}")

    async def analyze_intent(
        self,
        user_input: str,
        frameworks_context: str
    ) -> list[str]:
        """
        分析用户意图并返回推荐的框架 ID
        
        完全按照 SKILL.md 的 Step 2 逻辑执行：
        1. 识别用户场景
        2. 根据复杂度和领域匹配框架
        3. 返回 1-3 个最合适的框架

        Args:
            user_input: 用户输入的原始提示词或需求
            frameworks_context: 框架映射表上下文（Frameworks_Summary.md）

        Returns:
            1-3 个框架 ID 列表
        """
        try:
            # 按照 SKILL.md Step 2 的完整逻辑构建 Prompt
            prompt = f"""\
你是一个 Prompt 工程专家。请按照以下步骤分析用户需求并推荐框架：

## Step 1: 分析用户输入
用户需求：{user_input}

## Step 2: 匹配场景和选择框架

请参考以下框架列表：
{frameworks_context}

### 框架选择指南（按复杂度）：

**简单任务（≤3个元素）：**
APE, ERA, TAG, RTF, BAB, PEE, ELI5

**中等任务（4-5个元素）：**
RACE, CIDI, SPEAR, SPAR, FOCUS, SMART, GOPA, ORID, CARE, ROSE, PAUSE, TRACE, GRADE, TRACI, RODES

**复杂任务（6+个元素）：**
RACEF, CRISPE, SCAMPER, Six Thinking Hats, ROSES, PROMPT, RISEN, RASCEF, Atomic Prompting

### 框架选择指南（按领域）：

- **营销内容**: BAB, SPEAR, Challenge-Solution-Benefit, BLOG, PROMPT, RHODES
- **决策分析**: RICE, Pros and Cons, Six Thinking Hats, Tree of Thought, PAUSE, What If
- **教育培训**: Bloom's Taxonomy, ELI5, Socratic Method, PEE, Hamburger Model
- **产品开发**: SCAMPER, HMW, CIDI, RELIC, 3Cs Model
- **AI对话助手**: COAST, ROSES, TRACE, RACE, RASCEF
- **写作创作**: BLOG, 4S Method, Hamburger Model, Few-shot, RHODES, Chain of Destiny
- **图像生成**: Atomic Prompting
- **快速简单任务**: Zero-shot, ERA, TAG, APE, RTF
- **复杂推理**: Chain of Thought, Tree of Thought

## 你的任务：
1. 分析用户需求的复杂度（简单/中等/复杂）
2. 识别用户需求的领域类别
3. 根据上述指南，选择 1-3 个最合适的框架
4. 按匹配度从高到低排序

**输出格式：**
只返回框架 ID，用逗号分隔，不要包含其他内容。
例如：RACEF, Chain-of-Thought, BAB"""

            payload = {
                "model": "deepseek-chat",
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "你是一个 Prompt 工程专家，严格按照 SKILL.md 的框架选择指南工作。"
                            "你会分析任务复杂度和领域，然后推荐 1-3 个最合适的框架。"
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.3,
                "max_tokens": 150
            }

            result = await self._call_api_with_retry(payload)

            # 解析返回的框架 ID
            content = result["choices"][0]["message"]["content"].strip()
            framework_ids = [fid.strip() for fid in content.split(",")]

            # 清理框架 ID（移除可能的编号、引号等）
            cleaned_ids = []
            for fid in framework_ids:
                # 移除可能的编号（如 "1. RACEF" -> "RACEF"）
                fid = fid.split(".")[-1].strip()
                # 移除引号
                fid = fid.strip('"').strip("'")
                if fid:
                    cleaned_ids.append(fid)

            # 确保至少有 1 个，最多 3 个框架
            if not cleaned_ids:
                logger.warning("LLM 未返回任何框架，使用默认框架")
                cleaned_ids = ["RACEF"]
            
            # 限制为最多 3 个
            cleaned_ids = cleaned_ids[:3]

            logger.info(
                "Analyzed intent for input: %s... -> %s",
                user_input[:50],
                cleaned_ids,
            )
            return cleaned_ids

        except Exception as e:
            logger.error(f"Error during intent analysis: {e}")
            raise Exception(f"意图分析失败: {str(e)}")

    async def generate_prompt(
        self,
        user_input: str,
        framework_doc: str,
        clarification_answers: dict[str, str],
        attachment_content: str | None = None
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
            system_prompt = f"""\
你是一个专业的 Prompt 工程师。请根据以下框架文档和用户提供的信息，生成一个优化后的提示词。

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

            user_prompt += (
                "\n\n请基于上述框架文档和用户信息，生成一个完整的、优化后的提示词"
                "（使用 Markdown 格式）："
            )

            payload = {
                "model": "deepseek-chat",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 3000
            }

            result = await self._call_api_with_retry(payload)

            generated_prompt = result["choices"][0]["message"]["content"].strip()

            logger.info(f"Generated prompt for input: {user_input[:50]}...")
            return generated_prompt

        except Exception as e:
            logger.error(f"Error during prompt generation: {e}")
            raise Exception(f"提示词生成失败: {str(e)}")

    async def close(self):
        """关闭 HTTP 客户端"""
        await self.client.aclose()
