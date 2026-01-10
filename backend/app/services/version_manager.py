"""
Version Manager Service for managing prompt versions
"""
import logging
import os
import uuid
from datetime import UTC, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel

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
    version_number: str = "1.0"
    description: Optional[str] = None
    topic: Optional[str] = None
    framework_id: Optional[str] = None
    framework_name: Optional[str] = None
    original_input: Optional[str] = None

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
        self.MAX_VERSIONS = 20
        self.dev_mode = os.getenv("ENVIRONMENT", "development").lower() in [
            "development", "test", "testing"
        ]
        self._supabase_client = None
        
        # 开发模式使用内存存储
        if self.dev_mode:
            self.versions = {}  # user_id -> List[Version]
            logger.info("VersionManager initialized in dev mode (memory storage)")
        else:
            logger.info("VersionManager initialized in production mode")
    
    def _get_supabase(self):
        """延迟初始化 Supabase 客户端（仅在需要时）"""
        if self._supabase_client is None and not self.dev_mode:
            try:
                # 延迟导入，避免在模块加载时导入
                from supabase import create_client
                
                supabase_url = os.getenv("SUPABASE_URL")
                supabase_key = os.getenv("SUPABASE_KEY")
                
                if supabase_url and supabase_key:
                    self._supabase_client = create_client(supabase_url, supabase_key)
                    logger.info("Supabase client initialized successfully")
                else:
                    logger.warning("Supabase credentials not found, falling back to dev mode")
                    self.dev_mode = True
                    self.versions = {}
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {e}")
                logger.warning("Falling back to dev mode")
                self.dev_mode = True
                self.versions = {}
        
        return self._supabase_client

    async def save_version(
        self,
        user_id: str,
        content: str,
        version_type: VersionType,
        version_number: str = "1.0",
        description: Optional[str] = None,
        topic: Optional[str] = None,
        framework_id: Optional[str] = None,
        framework_name: Optional[str] = None,
        original_input: Optional[str] = None,
    ) -> Version:
        """
        保存一个新版本

        Args:
            user_id: 用户 ID
            content: 提示词内容
            version_type: 版本类型（save/optimize）
            version_number: 版本号
            description: 版本描述
            topic: 主题标签
            framework_id: 框架ID
            framework_name: 框架名称
            original_input: 原始输入

        Returns:
            保存的版本对象
        """
        try:
            now = datetime.now(UTC)
            version_id = str(uuid.uuid4())
            
            # 开发模式：使用内存存储
            if self.dev_mode:
                version = Version(
                    id=version_id,
                    user_id=user_id,
                    content=content,
                    type=version_type,
                    created_at=now,
                    version_number=version_number,
                    description=description,
                    topic=topic,
                    framework_id=framework_id,
                    framework_name=framework_name,
                    original_input=original_input,
                )
                
                if user_id not in self.versions:
                    self.versions[user_id] = []
                
                self.versions[user_id].insert(0, version)
                
                # 保持最多 MAX_VERSIONS 个版本
                if len(self.versions[user_id]) > self.MAX_VERSIONS:
                    self.versions[user_id] = self.versions[user_id][:self.MAX_VERSIONS]
                
                logger.info(f"Saved version {version.id} for user {user_id} (dev mode)")
                return version
            
            # 生产模式：保存到 Supabase
            supabase = self._get_supabase()
            if not supabase:
                # 如果Supabase初始化失败，回退到内存模式
                logger.warning("Supabase not available, using memory storage")
                return await self.save_version(
                    user_id, content, version_type, version_number,
                    description, topic, framework_id, framework_name, original_input
                )
            
            version_data = {
                'id': version_id,
                'user_id': user_id,
                'content': content,
                'type': version_type.value,
                'version_number': version_number,
                'description': description,
                'topic': topic,
                'framework_id': framework_id,
                'framework_name': framework_name,
                'original_input': original_input,
                'created_at': now.isoformat(),
                'updated_at': now.isoformat(),
            }
            
            response = supabase.table('versions').insert(version_data).execute()
            
            if not response.data:
                raise RuntimeError("Failed to save version to database")
            
            saved_data = response.data[0]
            version = Version(
                id=saved_data['id'],
                user_id=saved_data['user_id'],
                content=saved_data['content'],
                type=VersionType(saved_data['type']),
                created_at=datetime.fromisoformat(saved_data['created_at'].replace('Z', '+00:00')),
                version_number=saved_data['version_number'],
                description=saved_data.get('description'),
                topic=saved_data.get('topic'),
                framework_id=saved_data.get('framework_id'),
                framework_name=saved_data.get('framework_name'),
                original_input=saved_data.get('original_input'),
            )
            
            logger.info(f"Saved version {version.id} for user {user_id} to database")
            return version

        except Exception as e:
            logger.error(f"Error saving version for user {user_id}: {e}")
            raise

    async def get_versions(
        self,
        user_id: str,
        limit: int = 20
    ) -> list[Version]:
        """
        获取用户的版本列表

        Args:
            user_id: 用户 ID
            limit: 返回的最大版本数

        Returns:
            按时间倒序的版本列表
        """
        try:
            # 开发模式：从内存返回
            if self.dev_mode:
                user_versions = self.versions.get(user_id, [])
                sorted_versions = sorted(
                    user_versions,
                    key=lambda v: v.created_at,
                    reverse=True
                )
                result = sorted_versions[:limit]
                logger.info(f"Retrieved {len(result)} versions for user {user_id} (dev mode)")
                return result
            
            # 生产模式：从数据库查询
            supabase = self._get_supabase()
            if not supabase:
                logger.warning("Supabase not available, returning empty list")
                return []
            
            response = supabase.table('versions') \
                .select('*') \
                .eq('user_id', user_id) \
                .order('created_at', desc=True) \
                .limit(limit) \
                .execute()
            
            versions = []
            for data in response.data:
                version = Version(
                    id=data['id'],
                    user_id=data['user_id'],
                    content=data['content'],
                    type=VersionType(data['type']),
                    created_at=datetime.fromisoformat(data['created_at'].replace('Z', '+00:00')),
                    version_number=data['version_number'],
                    description=data.get('description'),
                    topic=data.get('topic'),
                    framework_id=data.get('framework_id'),
                    framework_name=data.get('framework_name'),
                    original_input=data.get('original_input'),
                )
                versions.append(version)
            
            logger.info(f"Retrieved {len(versions)} versions for user {user_id} from database")
            return versions

        except Exception as e:
            logger.error(f"Error getting versions for user {user_id}: {e}")
            raise

    async def get_version(
        self,
        version_id: str
    ) -> Version | None:
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
            if self.dev_mode:
                if user_id not in self.versions:
                    return False
                
                user_versions = self.versions[user_id]
                for i, version in enumerate(user_versions):
                    if version.id == version_id:
                        del user_versions[i]
                        logger.info(f"Deleted version {version_id} for user {user_id} (dev mode)")
                        return True
                
                logger.warning(f"Version {version_id} not found for user {user_id}")
                return False
            
            supabase = self._get_supabase()
            if not supabase:
                return False
            
            # 验证版本所有权
            response = supabase.table('versions') \
                .select('id') \
                .eq('id', version_id) \
                .eq('user_id', user_id) \
                .execute()
            
            if not response.data:
                logger.warning(f"Version {version_id} not found or not owned by user {user_id}")
                return False
            
            # 删除版本
            supabase.table('versions').delete().eq('id', version_id).execute()
            logger.info(f"Deleted version {version_id} for user {user_id}")
            return True

        except Exception as e:
            logger.error(f"Error deleting version {version_id}: {e}")
            raise

    async def get_version_count(self, user_id: str) -> int:
        """
        获取用户的版本数量

        Args:
            user_id: 用户 ID

        Returns:
            版本数量
        """
        try:
            if self.dev_mode:
                return len(self.versions.get(user_id, []))
            
            supabase = self._get_supabase()
            if not supabase:
                return 0
            
            response = supabase.table('versions') \
                .select('id', count='exact') \
                .eq('user_id', user_id) \
                .execute()
            
            return response.count or 0
        except Exception as e:
            logger.error(f"Error getting version count for user {user_id}: {e}")
            return 0

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

            logger.info(
                "Rolled back to version %s for user %s, created new version %s",
                version_id,
                user_id,
                new_version.id,
            )
            return new_version

        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Error rolling back to version {version_id}: {e}")
            raise
