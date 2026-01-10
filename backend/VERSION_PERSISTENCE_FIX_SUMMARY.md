# 版本持久化功能修复总结

## 问题描述

用户反馈：生成提示词后，版本没有保存到数据库，刷新页面后数据丢失，没有版本历史记录。

## 根本原因

`VersionManager` 使用 `ENVIRONMENT` 环境变量判断是否是开发模式，而 `.env` 文件中设置的是 `ENVIRONMENT=development`，导致即使设置了 `DEV_MODE=false`，版本管理器仍然使用内存存储而不是 Supabase。

## 解决方案

### 1. 统一开发模式判断逻辑

修改 `VersionManager` 使用 `settings.dev_mode`（来自 `DEV_MODE` 环境变量），与 `FeedbackService` 保持一致。

**修改文件**: `backend/app/services/version_manager.py`

**关键修改**:
```python
# 之前（错误）
def __init__(self):
    self.dev_mode = os.getenv("ENVIRONMENT", "development").lower() in [
        "development", "test", "testing"
    ]

# 之后（正确）
def __init__(self):
    settings = get_settings()
    self.settings = settings
    self.dev_mode = settings.dev_mode  # 使用 DEV_MODE 环境变量
```

### 2. 使用 Supabase REST API

将所有 Supabase 操作改为使用 REST API（与 `FeedbackService` 相同的方式），避免 Python SDK 与 Python 3.14 的兼容性问题。

**已实现的方法**:
- ✅ `save_version()` - 保存版本到 Supabase
- ✅ `get_versions()` - 从 Supabase 获取版本列表
- ✅ `get_version()` - 从 Supabase 获取单个版本
- ✅ `delete_version()` - 从 Supabase 删除版本
- ✅ `get_version_count()` - 从 Supabase 获取版本数量

### 3. 延迟初始化 HTTP 客户端

使用 `_get_client()` 方法延迟初始化 `httpx.AsyncClient`，避免模块导入时的阻塞操作。

```python
def _get_client(self):
    """延迟初始化 HTTP 客户端（使用 Supabase REST API）"""
    if self._http_client is None and not self.dev_mode:
        # 只在需要时才初始化
        self._http_client = httpx.AsyncClient(...)
    return self._http_client
```

## 测试结果

### 1. 后端 API 测试

```bash
$ python test_versions_api.py

=== 测试获取版本列表 ===
✅ 获取版本列表成功: 200
版本数量: 0

=== 测试保存版本 ===
✅ 保存版本成功: 200
版本 ID: 05a8fbc9-0487-4cb3-bf65-dd9dbbe8f7c1
版本号: 1.0

=== 再次获取版本列表 ===
✅ 获取版本列表成功: 200
版本数量: 1
```

### 2. Supabase 数据验证

```bash
$ python test_supabase_versions.py

=== 直接查询 Supabase 中的版本数据 ===

✅ 查询成功: 200
找到 1 个版本

版本 1:
  ID: 05a8fbc9-0487-4cb3-bf65-dd9dbbe8f7c1
  版本号: 1.0
  类型: save
  内容: 测试提示词内容...
  创建时间: 2026-01-10T14:22:25.259105
```

### 3. 后端日志

```
2026-01-10 22:22:23 - INFO - ✅ Supabase REST API client initialized (VersionManager)
2026-01-10 22:22:25 - INFO - ✅ Saved version 05a8fbc9-0487-4cb3-bf65-dd9dbbe8f7c1 for user dev-user-001 to Supabase
2026-01-10 22:22:26 - INFO - ✅ Retrieved 1 versions for user dev-user-001 from Supabase
```

## 环境变量配置

### 后端 `.env` 文件

```bash
# Supabase 配置
SUPABASE_URL=https://rfjymddhjocvnpsxkuiw.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # service_role JWT 密钥

# 开发模式（设置为 false 以使用 Supabase）
DEV_MODE=false

# 环境（不影响版本持久化）
ENVIRONMENT=development
```

### 前端 `.env.local` 文件

```bash
# Supabase 配置（前端使用 anon 密钥）
NEXT_PUBLIC_SUPABASE_URL=https://rfjymddhjocvnpsxkuiw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # anon JWT 密钥

# 开发模式
NEXT_PUBLIC_DEV_MODE=false
```

## 关键要点

1. **统一开发模式判断**: 所有服务都使用 `settings.dev_mode`（来自 `DEV_MODE` 环境变量）
2. **使用 REST API**: 避免 Python SDK 兼容性问题
3. **延迟初始化**: 避免模块导入时的阻塞操作
4. **回退机制**: 初始化失败时自动降级到内存存储
5. **完善的日志**: 清晰标识是使用 Supabase 还是内存存储

## 下一步

1. ✅ 后端版本持久化功能已完全修复
2. ⏭️ 测试前端完整流程：生成提示词 → 保存版本 → 刷新页面 → 验证版本历史还在
3. ⏭️ 部署到 Vercel 并更新环境变量

## 相关文件

- `backend/app/services/version_manager.py` - 版本管理服务（已修复）
- `backend/app/api/versions.py` - 版本 API 路由
- `backend/migrations/create_versions_table.sql` - 数据库表结构
- `backend/test_versions_api.py` - API 测试脚本
- `backend/test_supabase_versions.py` - Supabase 数据验证脚本
