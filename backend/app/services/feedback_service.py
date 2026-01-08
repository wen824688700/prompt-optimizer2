"""
反馈和投票服务
"""
import logging
from datetime import datetime
from typing import List
from uuid import UUID

from supabase import Client, create_client

from app.config import get_settings

logger = logging.getLogger(__name__)


class FeedbackService:
    """反馈和投票服务"""

    def __init__(self):
        settings = get_settings()
        self.settings = settings
        self._supabase: Client | None = None
    
    @property
    def supabase(self) -> Client | None:
        """延迟初始化 Supabase 客户端"""
        if self._supabase is None and not self.settings.dev_mode:
            if self.settings.supabase_url and self.settings.supabase_key:
                try:
                    self._supabase = create_client(
                        self.settings.supabase_url,
                        self.settings.supabase_key
                    )
                except Exception as e:
                    logger.error(f"Supabase 客户端初始化失败: {e}")
            else:
                logger.warning("Supabase 配置缺失，反馈功能将不可用")
        return self._supabase

    async def get_feature_options(self, user_id: str | None = None) -> List[dict]:
        """
        获取所有功能选项及投票统计
        
        Args:
            user_id: 用户 ID（可选，用于标记用户已投票的选项）
            
        Returns:
            功能选项列表，包含投票数和是否已投票
        """
        if not self.supabase:
            # 开发模式返回模拟数据
            return self._get_mock_options()

        try:
            # 获取所有激活的功能选项
            response = self.supabase.table("feature_options")\
                .select("*")\
                .eq("is_active", True)\
                .order("display_order")\
                .execute()
            
            options = response.data

            # 获取每个选项的投票数
            for option in options:
                vote_response = self.supabase.table("user_votes")\
                    .select("id", count="exact")\
                    .eq("option_id", option["id"])\
                    .execute()
                
                option["vote_count"] = vote_response.count or 0
                option["is_voted"] = False

            # 如果提供了 user_id，标记用户已投票的选项
            if user_id:
                user_votes_response = self.supabase.table("user_votes")\
                    .select("option_id")\
                    .eq("user_id", user_id)\
                    .execute()
                
                voted_option_ids = {vote["option_id"] for vote in user_votes_response.data}
                
                for option in options:
                    option["is_voted"] = option["id"] in voted_option_ids

            return options

        except Exception as e:
            logger.error(f"获取功能选项失败: {e}")
            raise

    async def submit_vote(self, user_id: str, option_ids: List[UUID]) -> dict:
        """
        提交投票（覆盖之前的投票）
        
        Args:
            user_id: 用户 ID
            option_ids: 选项 ID 列表（最多 3 个）
            
        Returns:
            投票结果
        """
        if not self.supabase:
            return {"success": True, "message": "开发模式：投票已记录"}

        if len(option_ids) > 3:
            raise ValueError("最多只能选择 3 个选项")

        try:
            # 删除用户之前的所有投票
            self.supabase.table("user_votes")\
                .delete()\
                .eq("user_id", user_id)\
                .execute()

            # 插入新的投票
            votes = [
                {
                    "user_id": user_id,
                    "option_id": str(option_id),
                    "created_at": datetime.utcnow().isoformat()
                }
                for option_id in option_ids
            ]

            self.supabase.table("user_votes")\
                .insert(votes)\
                .execute()

            logger.info(f"用户 {user_id} 提交了 {len(option_ids)} 个投票")
            
            return {
                "success": True,
                "message": "投票提交成功",
                "voted_count": len(option_ids)
            }

        except Exception as e:
            logger.error(f"提交投票失败: {e}")
            raise

    async def submit_feedback(self, user_id: str, content: str) -> dict:
        """
        提交反馈意见
        
        Args:
            user_id: 用户 ID
            content: 反馈内容
            
        Returns:
            反馈结果
        """
        if not self.supabase:
            return {"success": True, "message": "开发模式：反馈已记录"}

        try:
            feedback = {
                "user_id": user_id,
                "content": content.strip(),
                "created_at": datetime.utcnow().isoformat()
            }

            response = self.supabase.table("user_feedback")\
                .insert(feedback)\
                .execute()

            logger.info(f"用户 {user_id} 提交了反馈")
            
            return {
                "success": True,
                "message": "感谢您的反馈！",
                "feedback_id": response.data[0]["id"] if response.data else None
            }

        except Exception as e:
            logger.error(f"提交反馈失败: {e}")
            raise

    def _get_mock_options(self) -> List[dict]:
        """开发模式的模拟数据"""
        return [
            {
                "id": "00000000-0000-0000-0000-000000000001",
                "name": "多模型支持（GPT-4, Claude, Gemini 等）",
                "description": "支持多种 AI 模型进行提示词优化",
                "display_order": 1,
                "is_active": True,
                "vote_count": 42,
                "is_voted": False,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": "00000000-0000-0000-0000-000000000002",
                "name": "场景模板库（营销、代码、教育等预设模板）",
                "description": "提供各种场景的预设模板，快速开始",
                "display_order": 2,
                "is_active": True,
                "vote_count": 38,
                "is_voted": False,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": "00000000-0000-0000-0000-000000000003",
                "name": "新场景支持：生图提示词（Midjourney、SD 等）",
                "description": "支持生图场景的提示词优化",
                "display_order": 3,
                "is_active": True,
                "vote_count": 35,
                "is_voted": False,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": "00000000-0000-0000-0000-000000000004",
                "name": "多语言支持（英文、日文等）",
                "description": "支持多种语言的提示词优化",
                "display_order": 4,
                "is_active": True,
                "vote_count": 28,
                "is_voted": False,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": "00000000-0000-0000-0000-000000000005",
                "name": "API 接口（供开发者集成）",
                "description": "提供 API 接口供开发者集成到自己的应用",
                "display_order": 5,
                "is_active": True,
                "vote_count": 22,
                "is_voted": False,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": "00000000-0000-0000-0000-000000000006",
                "name": "其他（请在下方反馈区填写）",
                "description": "如有其他想法，欢迎在反馈区告诉我们",
                "display_order": 6,
                "is_active": True,
                "vote_count": 15,
                "is_voted": False,
                "created_at": datetime.utcnow().isoformat()
            }
        ]
