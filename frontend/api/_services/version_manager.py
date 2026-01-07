"""
Version Manager Service for managing prompt versions
"""
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel
from enum import Enum
import logging
import uuid

logger = logging.getLogger(__name__)


class VersionType(str, Enum):
    """版本类型枚举"""
    SAVE = "save"
    OPTIMIZE = "optimize"


class Version(BaseModel):
    """版本模型"""
    id: str
    user_id: str
    content: str
    type: VersionType
    created_at: datetime  # UTC
    
    @property
    def formatted_title(self) -> str:
        """返回格式化的标题：YYYY-MM-DD HH:mm:ss · 保存/优化"""
        # 格式化时间为 UTC
        time_str = self.created_at.strftime("%Y-%m-%d %H:%M:%S")
        type_str = "保存" if self.type == VersionType.SAVE else "优化"
        return f"{time_str} · {type_str}"


class VersionManager:
    """管理提示词版本"""
    
    def __init__(self):
        # 使用内存存储（生产环境应使用数据库）
        self.versions = {}  # user_id -> List[Version]
        self.MAX_VERSIONS = 10
    
    async def save_version(
        self,
        user_id: str,
        content: str,
        version_type: VersionType
    ) -> Version:
        """
        保存一个新版本
        
        Args:
            user_id: 用户 ID
            content: 提示词内容
            version_type: 版本类型（save/optimize）
        
        Returns:
            保存的版本对象
        """
        try:
            # 创建新版本
            version = Version(
                id=str(uuid.uuid4()),
                user_id=user_id,
                content=content,
                type=version_type,
                created_at=datetime.now(timezone.utc)
            )
            
            # 获取用户的版本列表
            if user_id not in self.versions:
                self.versions[user_id] = []
            
            # 添加新版本到列表开头
            self.versions[user_id].insert(0, version)
            
            # 保持最多 10 个版本
            if len(self.versions[user_id]) > self.MAX_VERSIONS:
                self.versions[user_id] = self.versions[user_id][:self.MAX_VERSIONS]
            
            logger.info(f"Saved version {version.id} for user {user_id}, type: {version_type}")
            return version
            
        except Exception as e:
            logger.error(f"Error saving version for user {user_id}: {e}")
            raise
    
    async def get_versions(
        self,
        user_id: str,
        limit: int = 10
    ) -> List[Version]:
        """
        获取用户的版本列表（最近 10 个）
        
        Args:
            user_id: 用户 ID
            limit: 返回的最大版本数
        
        Returns:
            按时间倒序的版本列表
        """
        try:
            # 获取用户的版本列表
            user_versions = self.versions.get(user_id, [])
            
            # 按时间倒序排序（最新的在前）
            sorted_versions = sorted(
                user_versions,
                key=lambda v: v.created_at,
                reverse=True
            )
            
            # 限制返回数量
            result = sorted_versions[:limit]
            
            logger.info(f"Retrieved {len(result)} versions for user {user_id}")
            return result
            
        except Exception as e:
            logger.error(f"Error getting versions for user {user_id}: {e}")
            raise
    
    async def get_version(
        self,
        version_id: str
    ) -> Optional[Version]:
        """
        获取特定版本
        
        Args:
            version_id: 版本 ID
        
        Returns:
            版本对象，如果不存在则返回 None
        """
        try:
            # 遍历所有用户的版本
            for user_versions in self.versions.values():
                for version in user_versions:
                    if version.id == version_id:
                        logger.info(f"Found version {version_id}")
                        return version
            
            logger.warning(f"Version {version_id} not found")
            return None
            
        except Exception as e:
            logger.error(f"Error getting version {version_id}: {e}")
            raise
    
    async def delete_version(
        self,
        user_id: str,
        version_id: str
    ) -> bool:
        """
        删除特定版本
        
        Args:
            user_id: 用户 ID
            version_id: 版本 ID
        
        Returns:
            是否成功删除
        """
        try:
            if user_id not in self.versions:
                return False
            
            # 查找并删除版本
            user_versions = self.versions[user_id]
            for i, version in enumerate(user_versions):
                if version.id == version_id:
                    del user_versions[i]
                    logger.info(f"Deleted version {version_id} for user {user_id}")
                    return True
            
            logger.warning(f"Version {version_id} not found for user {user_id}")
            return False
            
        except Exception as e:
            logger.error(f"Error deleting version {version_id}: {e}")
            raise
    
    def get_version_count(self, user_id: str) -> int:
        """
        获取用户的版本数量
        
        Args:
            user_id: 用户 ID
        
        Returns:
            版本数量
        """
        return len(self.versions.get(user_id, []))
    
    async def rollback_version(
        self,
        user_id: str,
        version_id: str
    ) -> Version:
        """
        回滚到特定版本
        
        将指定版本的内容作为新版本保存（类型为 SAVE）
        
        Args:
            user_id: 用户 ID
            version_id: 要回滚到的版本 ID
        
        Returns:
            新创建的版本对象
        
        Raises:
            ValueError: 如果版本不存在
        """
        try:
            # 获取要回滚的版本
            target_version = await self.get_version(version_id)
            
            if target_version is None:
                raise ValueError(f"Version {version_id} not found")
            
            # 验证版本属于该用户
            if target_version.user_id != user_id:
                raise ValueError(f"Version {version_id} does not belong to user {user_id}")
            
            # 创建新版本（回滚后的版本）
            new_version = await self.save_version(
                user_id=user_id,
                content=target_version.content,
                version_type=VersionType.SAVE
            )
            
            logger.info(f"Rolled back to version {version_id} for user {user_id}, created new version {new_version.id}")
            return new_version
            
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Error rolling back to version {version_id}: {e}")
            raise
