# 版本持久化功能测试指南

## 运行测试

### 1. 开发模式测试（内存存储）

```bash
cd backend
ENVIRONMENT=development python test_version_persistence.py
```

### 2. 生产模式测试（Supabase）

确保已配置环境变量：

```bash
# .env 文件
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-service-role-key
ENVIRONMENT=production
```

运行测试：

```bash
cd backend
python test_version_persistence.py
```

## 测试内容

测试脚本会验证以下功能：

1. ✅ 保存版本
2. ✅ 获取版本列表
3. ✅ 保存多个版本
4. ✅ 版本数量统计
5. ✅ 删除版本
6. ✅ 验证删除后的版本数量
7. ✅ 版本数量限制（最多20个）
8. ✅ 清理测试数据

## 预期输出

```
============================================================
测试版本持久化功能
============================================================
✓ 运行在开发模式（内存存储）

1. 测试保存版本...
✓ 版本已保存: xxx-xxx-xxx
  - 版本号: 1.0
  - 类型: optimize
  - 主题: 测试提示词优化

2. 测试获取版本列表...
✓ 获取到 1 个版本
  - 1.0: 初始生成版本 (optimize)

3. 测试保存更多版本...
✓ 版本已保存: xxx-xxx-xxx
✓ 版本已保存: xxx-xxx-xxx

4. 测试版本数量统计...
✓ 当前版本数量: 3

5. 测试删除版本...
✓ 版本已删除: xxx-xxx-xxx

6. 验证删除后的版本数量...
✓ 删除后版本数量: 2
✓ 剩余版本:
  - 2.0: 手动保存
  - 1.1: 重新优化生成

7. 测试版本数量限制...
  创建 20 个版本...
✓ 创建后版本数量: 20
✓ 版本数量限制生效（最多 20 个）

8. 清理测试数据...
✓ 已清理 20 个测试版本

============================================================
测试完成！
============================================================
```

## 故障排查

### 错误: Supabase 客户端未初始化

**原因**: 环境变量未配置或配置错误

**解决方案**:
1. 检查 `.env` 文件是否存在
2. 确认 `SUPABASE_URL` 和 `SUPABASE_KEY` 正确
3. 确认 `ENVIRONMENT=production`

### 错误: 保存失败

**可能原因**:
1. 数据库连接失败
2. 表不存在（未执行迁移）
3. RLS 策略阻止访问

**解决方案**:
1. 检查数据库连接
2. 执行 `create_versions_table.sql` 迁移
3. 使用 Service Role Key（不是 Anon Key）

### 错误: 版本数量超过限制

**原因**: 自动清理逻辑未生效

**解决方案**:
1. 检查 `_delete_oldest_version()` 方法
2. 查看后端日志
3. 手动清理测试数据

## 手动测试

### 使用 Python REPL

```python
import asyncio
from app.services.version_manager import VersionManager, VersionType

async def test():
    manager = VersionManager()
    
    # 保存版本
    version = await manager.save_version(
        user_id="test_user",
        content="测试内容",
        version_type=VersionType.OPTIMIZE,
        version_number="1.0",
        description="测试版本",
    )
    print(f"版本ID: {version.id}")
    
    # 获取版本列表
    versions = await manager.get_versions("test_user")
    print(f"版本数量: {len(versions)}")

asyncio.run(test())
```

### 使用 curl 测试 API

```bash
# 保存版本
curl -X POST http://localhost:8000/api/v1/versions \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "content": "测试内容",
    "type": "optimize",
    "version_number": "1.0",
    "description": "测试版本"
  }'

# 获取版本列表
curl http://localhost:8000/api/v1/versions?user_id=test_user

# 删除版本
curl -X DELETE http://localhost:8000/api/v1/versions/{version_id}?user_id=test_user
```

## 性能测试

### 测试大量版本

```python
import asyncio
import time
from app.services.version_manager import VersionManager, VersionType

async def performance_test():
    manager = VersionManager()
    user_id = "perf_test_user"
    
    # 测试保存性能
    start = time.time()
    for i in range(100):
        await manager.save_version(
            user_id=user_id,
            content=f"版本 {i}",
            version_type=VersionType.OPTIMIZE,
            version_number=f"1.{i}",
        )
    elapsed = time.time() - start
    print(f"保存 100 个版本耗时: {elapsed:.2f} 秒")
    
    # 测试查询性能
    start = time.time()
    versions = await manager.get_versions(user_id, limit=20)
    elapsed = time.time() - start
    print(f"查询 20 个版本耗时: {elapsed:.2f} 秒")
    
    # 清理
    for v in versions:
        await manager.delete_version(user_id, v.id)

asyncio.run(performance_test())
```

## 集成测试

### 使用 pytest

```bash
cd backend
pytest tests/test_version_manager.py -v
```

### 测试覆盖率

```bash
cd backend
pytest tests/test_version_manager.py --cov=app.services.version_manager --cov-report=html
```

## 下一步

1. ✅ 运行基础测试
2. ✅ 验证数据库持久化
3. ⏳ 添加更多边界测试
4. ⏳ 性能基准测试
5. ⏳ 集成到 CI/CD
