"""
Prompts API endpoints
"""
import glob
import logging
import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.api.frameworks import get_llm_service
from app.services.llm_factory import LLMFactory
from app.services.quota_manager import QuotaManager
from app.services.version_manager import VersionManager, VersionType

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/prompts", tags=["prompts"])

# 全局服务实例
version_manager = VersionManager()
quota_manager = QuotaManager()


def _load_framework_doc(framework_id: str) -> str:
    """
    加载框架文档

    Args:
        framework_id: 框架 ID（例如：Chain of Thought）

    Returns:
        框架文档内容
    """
    try:
        # 获取项目根目录
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))

        # 构建框架目录路径
        frameworks_dir = os.path.join(
            project_root,
            "skills-main",
            "skills",
            "prompt-optimizer",
            "references",
            "frameworks"
        )

        # 查找匹配的框架文件
        # 文件名格式：XX_FrameworkName_Framework.md
        pattern = os.path.join(frameworks_dir, f"*_{framework_id.replace(' ', '_')}_Framework.md")
        matching_files = glob.glob(pattern)

        if not matching_files:
            logger.warning(f"Framework file not found for: {framework_id}")
            # 返回一个基本的框架文档
            return f"""# {framework_id} Framework

## 概述
这是 {framework_id} 框架的基本说明。

## 应用场景
适用于各种提示词优化场景。

## 框架构成
请根据用户需求和框架特点生成优化后的提示词。
"""

        # 读取第一个匹配的文件
        framework_file = matching_files[0]
        with open(framework_file, encoding="utf-8") as f:
            content = f.read()

        logger.info(f"Loaded framework doc from {framework_file}")
        return content

    except Exception as e:
        logger.error(f"Error loading framework doc: {e}")
        # 返回一个基本的框架文档作为后备
        return f"""# {framework_id} Framework

## 概述
这是 {framework_id} 框架的基本说明。

## 应用场景
适用于各种提示词优化场景。
"""


def _generate_topic_label(user_input: str) -> str:
    """
    生成简洁的主题标签
    
    从用户输入中提取关键词，生成简洁的主题标签
    
    Args:
        user_input: 用户输入的原始文本
        
    Returns:
        简洁的主题标签（最多10个字符）
    """
    # 移除常见的开头词
    input_clean = user_input.strip()
    
    # 移除常见的请求词
    remove_prefixes = [
        "帮我", "请帮我", "帮忙", "请", "我想", "我要", "能否", "可以", "麻烦",
        "写一个", "写个", "生成一个", "生成", "创建一个", "创建",
    ]
    
    for prefix in remove_prefixes:
        if input_clean.startswith(prefix):
            input_clean = input_clean[len(prefix):].strip()
    
    # 移除常见的结尾词
    remove_suffixes = ["吗", "呢", "吧", "啊", "。", "？", "！"]
    for suffix in remove_suffixes:
        if input_clean.endswith(suffix):
            input_clean = input_clean[:-len(suffix)].strip()
    
    # 提取关键部分（去掉"关于"等连接词）
    if "关于" in input_clean:
        # 提取"关于"后面的内容
        parts = input_clean.split("关于", 1)
        if len(parts) > 1:
            input_clean = parts[1].strip()
    
    # 移除逗号及后面的补充说明（如"，需要吸引年轻用户"）
    if "，" in input_clean:
        input_clean = input_clean.split("，")[0].strip()
    if "," in input_clean:
        input_clean = input_clean.split(",")[0].strip()
    
    # 移除常见的文体词（只移除单独的文体词，保留"XX文档"这样的组合）
    standalone_doc_types = ["的文案", "的文档", "的指南", "的介绍", "的建议", "的攻略", "的演讲稿", "的说明"]
    for doc_type in standalone_doc_types:
        if input_clean.endswith(doc_type):
            # 移除"的XX"，保留前面的核心内容
            input_clean = input_clean[:-len(doc_type)].strip()
            break
    
    # 如果没有匹配到"的XX"，尝试移除单独的文体词（但保留组合词）
    if len(input_clean) > 10:
        single_doc_types = ["文案", "介绍", "建议", "攻略", "演讲稿", "说明"]
        for doc_type in single_doc_types:
            if input_clean.endswith(doc_type) and len(input_clean) > len(doc_type):
                # 检查前面是否有"的"，如果有则保留组合词
                if not input_clean.endswith(f"的{doc_type}"):
                    input_clean = input_clean[:-len(doc_type)].strip()
                    break
    
    # 处理"优化XX"这样的动词开头
    if input_clean.startswith("优化"):
        # 提取"优化"后面的内容
        content = input_clean[2:].strip()
        if content.startswith("这段"):
            content = content[2:].strip()
        if len(content) <= 4:
            input_clean = content + "优化"
        else:
            input_clean = content[:4] + "优化"
    
    # 限制长度（最多10个字符，保持简洁）
    if len(input_clean) > 10:
        input_clean = input_clean[:10]
    
    # 如果处理后为空，使用原始输入的前10个字符
    if not input_clean:
        input_clean = user_input[:10]
    
    return input_clean


class GenerateRequest(BaseModel):
    """提示词生成请求"""
    input: str = Field(..., min_length=10, description="用户原始输入")
    framework_id: str = Field(..., description="选择的框架 ID")
    clarification_answers: dict[str, str] = Field(..., description="追问问题的答案")
    attachment_content: str | None = Field(None, description="附件内容")
    user_id: str = Field("test_user", description="用户 ID")
    account_type: str = Field("free", description="账户类型（free/pro）")
    model: str = Field("deepseek", description="使用的模型（deepseek/gemini）")
    timezone_offset: int = Field(0, description="用户时区偏移量（分钟），例如 +480 表示 UTC+8")


class GenerateResponse(BaseModel):
    """提示词生成响应"""
    output: str
    framework_used: str
    version_id: str


@router.post("/generate", response_model=GenerateResponse)
async def generate_prompt(request: GenerateRequest):
    """
    生成优化后的提示词

    根据用户输入、选择的框架和追问答案，生成优化后的提示词
    """
    try:
        # 检查配额
        can_generate = await quota_manager.consume_quota(
            user_id=request.user_id,
            account_type=request.account_type,
            user_timezone_offset=request.timezone_offset
        )

        if not can_generate:
            quota_status = await quota_manager.check_quota(
                user_id=request.user_id,
                account_type=request.account_type,
                user_timezone_offset=request.timezone_offset
            )
            raise HTTPException(
                status_code=403,
                detail={
                    "code": "QUOTA_EXCEEDED",
                    "message": f"您已达到每日配额限制（{quota_status.total}次）",
                    "quota": {
                        "used": quota_status.used,
                        "total": quota_status.total,
                        "reset_time": quota_status.reset_time.isoformat()
                    }
                }
            )

        # 验证模型类型
        if request.model not in LLMFactory.get_supported_models():
            raise HTTPException(
                status_code=400,
                detail=f"不支持的模型类型: {request.model}"
            )

        # 获取对应模型的 LLM 服务
        llm_service = get_llm_service(request.model)

        # 加载框架文档
        framework_doc = _load_framework_doc(request.framework_id)

        # 生成提示词
        generated_output = await llm_service.generate_prompt(
            user_input=request.input,
            framework_doc=framework_doc,
            clarification_answers=request.clarification_answers,
            attachment_content=request.attachment_content
        )

        # 计算版本号：查询该用户该主题的最新版本
        # 生成简洁的主题标签（提取关键词）
        topic = _generate_topic_label(request.input)
        
        existing_versions = await version_manager.get_versions(
            user_id=request.user_id,
            limit=100  # 获取足够多的版本以便过滤
        )
        
        # 过滤出相同主题的版本
        topic_versions = [v for v in existing_versions if v.topic == topic]
        
        # 计算下一个版本号
        if not topic_versions:
            version_number = "1.0"
        else:
            # 获取最新版本号
            latest_version = topic_versions[0]
            major, minor = map(int, latest_version.version_number.split('.'))
            # 优化生成：小版本号递增
            version_number = f"{major}.{minor + 1}"

        # 保存版本
        version = await version_manager.save_version(
            user_id=request.user_id,
            content=generated_output,
            version_type=VersionType.OPTIMIZE,
            version_number=version_number,
            description="初始生成版本" if version_number == "1.0" else "优化生成",
            topic=topic,
            framework_id=request.framework_id,
            framework_name=request.framework_id,
            original_input=request.input,
        )

        return GenerateResponse(
            output=generated_output,
            framework_used=request.framework_id,
            version_id=version.id
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"提示词生成失败: {str(e)}"
        )



class GenerateSummaryRequest(BaseModel):
    """生成摘要请求"""
    content: str = Field(..., description="需要生成摘要的内容")
    max_length: int = Field(20, description="摘要最大长度")


class GenerateSummaryResponse(BaseModel):
    """生成摘要响应"""
    summary: str = Field(..., description="生成的摘要")


@router.post("/generate-summary", response_model=GenerateSummaryResponse)
async def generate_summary(request: GenerateSummaryRequest):
    """
    使用 LLM 生成内容摘要
    
    Args:
        request: 包含内容和最大长度的请求
        
    Returns:
        生成的摘要
    """
    try:
        llm_service = get_llm_service("deepseek")
        
        # 构建提示词
        prompt = f"""请为以下内容生成一个简洁的摘要标题，不超过{request.max_length}个字：

内容：
{request.content[:500]}

要求：
1. 提取核心主题
2. 简洁明了
3. 不超过{request.max_length}个字
4. 只返回摘要文本，不要其他说明

摘要："""

        # 调用 LLM
        response = await llm_service._call_api_with_retry({
            "model": llm_service.model,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 50,
        })
        
        summary = response["choices"][0]["message"]["content"].strip()
        
        # 清理摘要（移除引号、句号等）
        summary = summary.strip('"\'。！？')
        
        # 确保不超过最大长度
        if len(summary) > request.max_length:
            summary = summary[:request.max_length]
        
        return GenerateSummaryResponse(summary=summary)
        
    except Exception as e:
        logger.error(f"Error generating summary: {e}")
        # 如果 LLM 失败，使用简单的文本处理作为后备
        fallback_summary = request.content[:request.max_length].strip()
        return GenerateSummaryResponse(summary=fallback_summary)
