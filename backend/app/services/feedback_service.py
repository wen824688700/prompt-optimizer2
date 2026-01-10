"""
反馈和投票服务 - 使用 Supabase REST API
"""
import logging
from datetime import datetime
from typing import List
from uuid import UUID
import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)


class FeedbackService:
    """反馈和投票服务"""

    def __init__(self):
        settings = get_settings()
        self.settings = settings
        self._client = None
    
    def _get_client(self) -> httpx.AsyncClient | None:
        """获取 HTTP 客户端"""
        if self._client is None:
            if self.settings.dev_mode:
                logger.warning("⚠️ 开发模式已启用 (DEV_MODE=true)，反馈功能将使用模拟数据")
                return None
            
            if not self.settings.supabase_url or not self.settings.supabase_key:
                logger.error("❌ Supabase 配置不完整，反馈功能将使用模拟数据")
                return None
            
            try:
                logger.info(f"🔍 正在初始化 Supabase REST API 客户端（反馈功能）...")
                
                # 使用 httpx 直接调用 Supabase REST API
                self._client = httpx.AsyncClient(
                    base_url=f"{self.settings.supabase_url}/rest/v1",
                    headers={
                        "apikey": self.settings.supabase_key,
                        "Authorization": f"Bearer {self.settings.supabase_key}",
                        "Content-Type": "application/json",
                        "Prefer": "return=representation"
                    },
                    timeout=30.0
                )
                logger.info(f"✅ Supabase REST API 客户端初始化成功（反馈功能）")
            except Exception as e:
                logger.error(f"❌ Supabase REST API 客户端初始化失败: {e}")
                logger.warning("将回退到模拟数据模式（票数不会更新）")
                return None
        
        return self._client

    async def get_feature_options(self, user_id: str | None = None) -> List[dict]:
        """
        获取所有功能选项及投票统计
        
        Args:
            user_id: 用户 ID（可选，用于标记用户已投票的选项）
            
        Returns:
            功能选项列表，包含投票数和是否已投票
        """
        client = self._get_client()
        if not client:
            # 开发模式或 Supabase 不可用时返回模拟数据
            logger.warning("使用模拟数据返回功能选项（票数不会更新）")
            return self._get_mock_options()

        try:
            # 获取所有激活的功能选项
            response = await client.get(
                "/feature_options",
                params={
                    "is_active": "eq.true",
                    "order": "display_order"
                }
            )
            response.raise_for_status()
            options = response.json()

            # 一次性获取所有投票数据
            all_votes_response = await client.get(
                "/user_votes",
                params={"select": "option_id"}
            )
            all_votes_response.raise_for_status()
            all_votes = all_votes_response.json()
            
            # 统计每个选项的票数
            vote_counts = {}
            for vote in all_votes:
                option_id = vote["option_id"]
                vote_counts[option_id] = vote_counts.get(option_id, 0) + 1
            
            # 为每个选项添加票数
            for option in options:
                option["vote_count"] = vote_counts.get(option["id"], 0)
                option["is_voted"] = False

            # 如果提供了 user_id，标记用户已投票的选项
            if user_id:
                try:
                    user_votes_response = await client.get(
                        "/user_votes",
                        params={
                            "user_id": f"eq.{user_id}",
                            "select": "option_id"
                        }
                    )
                    
                    if user_votes_response.status_code == 200:
                        voted_option_ids = {row["option_id"] for row in user_votes_response.json()}
                        
                        for option in options:
                            option["is_voted"] = option["id"] in voted_option_ids
                    else:
                        # 如果查询用户投票失败，不影响整体功能
                        logger.warning(f"查询用户投票失败: {user_votes_response.status_code}")
                except Exception as e:
                    logger.warning(f"查询用户投票失败: {e}")

            return options

        except Exception as e:
            error_msg = str(e).lower()
            if "does not exist" in error_msg or "relation" in error_msg or "404" in error_msg:
                logger.error(f"❌ 数据库表不存在: {e}")
                logger.error(f"💡 请在 Supabase 中执行迁移文件: backend/migrations/create_feedback_tables.sql")
            else:
                logger.error(f"❌ 获取功能选项失败: {e}")
            
            # 回退到模拟数据
            logger.warning("回退到模拟数据模式")
            return self._get_mock_options()

    async def submit_vote(self, user_id: str, option_ids: List[UUID]) -> dict:
        """
        提交投票（覆盖之前的投票）
        
        Args:
            user_id: 用户 ID
            option_ids: 选项 ID 列表（最多 3 个）
            
        Returns:
            投票结果
        """
        client = self._get_client()
        if not client:
            return {"success": True, "message": "开发模式：投票已记录"}

        if len(option_ids) > 3:
            raise ValueError("最多只能选择 3 个选项")

        try:
            # 删除用户之前的所有投票
            try:
                delete_response = await client.delete(
                    "/user_votes",
                    params={"user_id": f"eq.{user_id}"}
                )
                # 204 No Content 是成功的，400 可能是没有数据，也算成功
                if delete_response.status_code not in [200, 204, 400]:
                    delete_response.raise_for_status()
            except Exception as e:
                # 删除失败不影响插入
                logger.warning(f"删除旧投票失败（可能没有旧数据）: {e}")

            # 插入新的投票
            votes_data = [
                {
                    "user_id": user_id,
                    "option_id": str(option_id),
                    "created_at": datetime.utcnow().isoformat()
                }
                for option_id in option_ids
            ]
            
            insert_response = await client.post(
                "/user_votes",
                json=votes_data
            )
            
            if insert_response.status_code not in [200, 201]:
                error_text = insert_response.text
                logger.error(f"插入投票失败: {insert_response.status_code} - {error_text}")
                insert_response.raise_for_status()

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
        client = self._get_client()
        if not client:
            return {"success": True, "message": "开发模式：反馈已记录"}

        try:
            response = await client.post(
                "/user_feedback",
                json={
                    "user_id": user_id,
                    "content": content.strip(),
                    "created_at": datetime.utcnow().isoformat()
                }
            )
            response.raise_for_status()
            
            result = response.json()
            feedback_id = result[0]["id"] if result else None

            logger.info(f"用户 {user_id} 提交了反馈")
            
            return {
                "success": True,
                "message": "感谢您的反馈！",
                "feedback_id": str(feedback_id) if feedback_id else None
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
            }
        ]
    
    async def __aenter__(self):
        """异步上下文管理器入口"""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """异步上下文管理器退出，清理资源"""
        if self._client:
            await self._client.aclose()
