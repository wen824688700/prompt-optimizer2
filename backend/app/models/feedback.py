"""
反馈和投票相关的数据模型
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class FeatureOption(BaseModel):
    """功能选项模型"""
    id: UUID
    name: str
    description: Optional[str] = None
    display_order: int
    is_active: bool = True
    created_at: datetime


class FeatureOptionWithVotes(FeatureOption):
    """带投票数的功能选项"""
    vote_count: int = 0
    is_voted: bool = False  # 当前用户是否已投票


class VoteRequest(BaseModel):
    """投票请求"""
    option_ids: list[UUID] = Field(..., min_length=1, max_length=3)


class FeedbackRequest(BaseModel):
    """反馈请求"""
    content: str = Field(..., min_length=1, max_length=2000)


class FeedbackResponse(BaseModel):
    """反馈响应"""
    id: UUID
    user_id: UUID
    content: str
    created_at: datetime
