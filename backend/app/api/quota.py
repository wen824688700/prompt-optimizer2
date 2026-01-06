"""
Quota API endpoints
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.quota_manager import QuotaManager

router = APIRouter(prefix="/api/v1/quota", tags=["quota"])

# 全局服务实例
quota_manager = QuotaManager()


class QuotaResponse(BaseModel):
    """配额响应"""
    used: int
    total: int
    reset_time: str
    can_generate: bool


@router.get("", response_model=QuotaResponse)
async def get_quota(
    user_id: str = "test_user",
    account_type: str = "free",
    timezone_offset: int = 0
):
    """
    获取用户配额信息
    
    Args:
        user_id: 用户 ID
        account_type: 账户类型（free/pro）
        timezone_offset: 用户时区偏移量（分钟），例如 +480 表示 UTC+8
    
    返回用户当日已用配额、总配额和重置时间
    """
    try:
        status = await quota_manager.check_quota(
            user_id=user_id,
            account_type=account_type,
            user_timezone_offset=timezone_offset
        )
        
        return QuotaResponse(
            used=status.used,
            total=status.total,
            reset_time=status.reset_time.isoformat(),
            can_generate=status.can_generate
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"获取配额信息失败: {str(e)}"
        )
