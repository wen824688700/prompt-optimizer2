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


class GenerateRequest(BaseModel):
    """提示词生成请求"""
    input: str = Field(..., min_length=10, description="用户原始输入")
    framework_id: str = Field(..., description="选择的框架 ID")
    clarification_answers: dict[str, str] = Field(..., description="追问问题的答案")
    attachment_content: str | None = Field(None, description="附件内容")
    user_id: str = Field("test_user", description="用户 ID")
    account_type: str = Field("free", description="账户类型（free/pro）")
    model: str = Field("deepseek", description="使用的模型（deepseek/gemini）")


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
            account_type=request.account_type
        )

        if not can_generate:
            quota_status = await quota_manager.check_quota(
                user_id=request.user_id,
                account_type=request.account_type
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

        # 保存版本
        version = await version_manager.save_version(
            user_id=request.user_id,
            content=generated_output,
            version_type=VersionType.OPTIMIZE,
            version_number="1.0",
            description="初始生成版本",
            topic=request.input[:20] + ("..." if len(request.input) > 20 else ""),
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
