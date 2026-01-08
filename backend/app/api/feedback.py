"""
反馈和投票 API endpoints
"""
import logging
from typing import List

from fastapi import APIRouter, HTTPException, Header

from app.models.feedback import (
    FeatureOptionWithVotes,
    VoteRequest,
    FeedbackRequest
)
from app.services.feedback_service import FeedbackService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/feedback", tags=["feedback"])

# 全局服务实例
feedback_service = FeedbackService()


@router.get("/options", response_model=List[FeatureOptionWithVotes])
async def get_feature_options(
    user_id: str | None = Header(None, alias="x-user-id")
):
    """
    获取所有功能选项及投票统计
    
    Headers:
        x-user-id: 用户 ID（可选，用于标记用户已投票的选项）
    """
    try:
        options = await feedback_service.get_feature_options(user_id)
        return options
    except Exception as e:
        logger.error(f"获取功能选项失败: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"获取功能选项失败: {str(e)}"
        )


@router.post("/vote")
async def submit_vote(
    vote_request: VoteRequest,
    user_id: str = Header(..., alias="x-user-id")
):
    """
    提交投票（覆盖之前的投票）
    
    Headers:
        x-user-id: 用户 ID（必需）
        
    Body:
        option_ids: 选项 ID 列表（最多 3 个）
    """
    try:
        if len(vote_request.option_ids) > 3:
            raise HTTPException(
                status_code=400,
                detail="最多只能选择 3 个选项"
            )
        
        result = await feedback_service.submit_vote(
            user_id=user_id,
            option_ids=vote_request.option_ids
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"提交投票失败: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"提交投票失败: {str(e)}"
        )


@router.post("/submit")
async def submit_feedback(
    feedback_request: FeedbackRequest,
    user_id: str = Header(..., alias="x-user-id")
):
    """
    提交反馈意见
    
    Headers:
        x-user-id: 用户 ID（必需）
        
    Body:
        content: 反馈内容（1-2000 字符）
    """
    try:
        result = await feedback_service.submit_feedback(
            user_id=user_id,
            content=feedback_request.content
        )
        return result
    except Exception as e:
        logger.error(f"提交反馈失败: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"提交反馈失败: {str(e)}"
        )
