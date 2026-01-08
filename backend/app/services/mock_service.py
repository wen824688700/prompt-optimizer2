"""开发模式模拟服务 - 用于本地测试，无需数据库连接"""

from datetime import datetime
from typing import Any


class MockUser:
    """模拟用户"""
    def __init__(self, user_id: str = "dev-user-001"):
        self.id = user_id
        self.email = "dev@test.com"
        self.account_type = "pro"  # 开发模式默认 pro 账户
        self.created_at = datetime.now()


class MockQuotaService:
    """模拟配额服务"""
    
    def __init__(self):
        self.usage = {}
    
    async def check_quota(self, user_id: str) -> dict[str, Any]:
        """检查配额"""
        return {
            "user_id": user_id,
            "daily_limit": 100,
            "daily_used": self.usage.get(user_id, 0),
            "remaining": 100 - self.usage.get(user_id, 0),
            "account_type": "pro",
        }
    
    async def increment_usage(self, user_id: str) -> bool:
        """增加使用次数"""
        current = self.usage.get(user_id, 0)
        self.usage[user_id] = current + 1
        return True


class MockVersionService:
    """模拟版本服务"""
    
    def __init__(self):
        self.versions = {}
        self.version_counter = {}
    
    async def save_version(
        self,
        user_id: str,
        prompt_id: str,
        content: str,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """保存版本"""
        key = f"{user_id}:{prompt_id}"
        if key not in self.versions:
            self.versions[key] = []
            self.version_counter[key] = 0
        
        self.version_counter[key] += 1
        version = {
            "id": f"version-{self.version_counter[key]}",
            "prompt_id": prompt_id,
            "user_id": user_id,
            "version_number": self.version_counter[key],
            "content": content,
            "metadata": metadata or {},
            "created_at": datetime.now().isoformat(),
        }
        self.versions[key].append(version)
        return version
    
    async def get_versions(self, user_id: str, prompt_id: str) -> list[dict[str, Any]]:
        """获取版本列表"""
        key = f"{user_id}:{prompt_id}"
        return self.versions.get(key, [])
    
    async def get_version(self, version_id: str) -> dict[str, Any] | None:
        """获取单个版本"""
        for versions in self.versions.values():
            for version in versions:
                if version["id"] == version_id:
                    return version
        return None


# 全局单例
_mock_quota_service = MockQuotaService()
_mock_version_service = MockVersionService()


def get_mock_user(user_id: str = "dev-user-001") -> MockUser:
    """获取模拟用户"""
    return MockUser(user_id)


def get_mock_quota_service() -> MockQuotaService:
    """获取模拟配额服务"""
    return _mock_quota_service


def get_mock_version_service() -> MockVersionService:
    """获取模拟版本服务"""
    return _mock_version_service
