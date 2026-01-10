"""
测试版本持久化功能
"""
import asyncio
import os
from app.services.version_manager import VersionManager, VersionType


async def test_version_persistence():
    """测试版本持久化功能"""
    print("=" * 60)
    print("测试版本持久化功能")
    print("=" * 60)
    
    # 创建版本管理器
    manager = VersionManager()
    
    # 检查模式
    if manager.dev_mode:
        print("✓ 运行在开发模式（内存存储）")
    else:
        print("✓ 运行在生产模式（Supabase）")
        if manager.supabase:
            print("✓ Supabase 客户端已初始化")
        else:
            print("✗ Supabase 客户端未初始化")
            return
    
    print()
    
    # 测试用户ID
    test_user_id = "test_user_001"
    
    # 1. 测试保存版本
    print("1. 测试保存版本...")
    try:
        version1 = await manager.save_version(
            user_id=test_user_id,
            content="这是第一个测试版本的内容",
            version_type=VersionType.OPTIMIZE,
            version_number="1.0",
            description="初始生成版本",
            topic="测试提示词优化",
            framework_id="RACEF",
            framework_name="RACEF Framework",
            original_input="帮我优化这个提示词",
        )
        print(f"✓ 版本已保存: {version1.id}")
        print(f"  - 版本号: {version1.version_number}")
        print(f"  - 类型: {version1.type}")
        print(f"  - 主题: {version1.topic}")
    except Exception as e:
        print(f"✗ 保存失败: {e}")
        return
    
    print()
    
    # 2. 测试获取版本列表
    print("2. 测试获取版本列表...")
    try:
        versions = await manager.get_versions(test_user_id, limit=10)
        print(f"✓ 获取到 {len(versions)} 个版本")
        for v in versions:
            print(f"  - {v.version_number}: {v.description} ({v.type})")
    except Exception as e:
        print(f"✗ 获取失败: {e}")
        return
    
    print()
    
    # 3. 测试保存更多版本
    print("3. 测试保存更多版本...")
    try:
        version2 = await manager.save_version(
            user_id=test_user_id,
            content="这是第二个测试版本的内容",
            version_type=VersionType.OPTIMIZE,
            version_number="1.1",
            description="重新优化生成",
            topic="测试提示词优化",
            framework_id="RACEF",
            framework_name="RACEF Framework",
            original_input="帮我优化这个提示词",
        )
        print(f"✓ 版本已保存: {version2.id}")
        
        version3 = await manager.save_version(
            user_id=test_user_id,
            content="这是第三个测试版本的内容",
            version_type=VersionType.SAVE,
            version_number="2.0",
            description="手动保存",
            topic="测试提示词优化",
            framework_id="RACEF",
            framework_name="RACEF Framework",
            original_input="帮我优化这个提示词",
        )
        print(f"✓ 版本已保存: {version3.id}")
    except Exception as e:
        print(f"✗ 保存失败: {e}")
        return
    
    print()
    
    # 4. 测试版本数量统计
    print("4. 测试版本数量统计...")
    try:
        count = await manager.get_version_count(test_user_id)
        print(f"✓ 当前版本数量: {count}")
    except Exception as e:
        print(f"✗ 统计失败: {e}")
        return
    
    print()
    
    # 5. 测试删除版本
    print("5. 测试删除版本...")
    try:
        success = await manager.delete_version(test_user_id, version1.id)
        if success:
            print(f"✓ 版本已删除: {version1.id}")
        else:
            print(f"✗ 删除失败: 版本不存在")
    except Exception as e:
        print(f"✗ 删除失败: {e}")
        return
    
    print()
    
    # 6. 验证删除后的版本数量
    print("6. 验证删除后的版本数量...")
    try:
        count = await manager.get_version_count(test_user_id)
        print(f"✓ 删除后版本数量: {count}")
        
        versions = await manager.get_versions(test_user_id, limit=10)
        print(f"✓ 剩余版本:")
        for v in versions:
            print(f"  - {v.version_number}: {v.description}")
    except Exception as e:
        print(f"✗ 验证失败: {e}")
        return
    
    print()
    
    # 7. 测试版本数量限制（创建多个版本）
    print("7. 测试版本数量限制...")
    try:
        print(f"  创建 20 个版本...")
        for i in range(20):
            await manager.save_version(
                user_id=test_user_id,
                content=f"测试版本 {i+1}",
                version_type=VersionType.OPTIMIZE,
                version_number=f"1.{i+2}",
                description=f"测试版本 {i+1}",
                topic="测试",
            )
        
        count = await manager.get_version_count(test_user_id)
        print(f"✓ 创建后版本数量: {count}")
        
        if count <= manager.MAX_VERSIONS:
            print(f"✓ 版本数量限制生效（最多 {manager.MAX_VERSIONS} 个）")
        else:
            print(f"✗ 版本数量超过限制: {count} > {manager.MAX_VERSIONS}")
    except Exception as e:
        print(f"✗ 测试失败: {e}")
        return
    
    print()
    
    # 8. 清理测试数据
    print("8. 清理测试数据...")
    try:
        versions = await manager.get_versions(test_user_id, limit=100)
        for v in versions:
            await manager.delete_version(test_user_id, v.id)
        print(f"✓ 已清理 {len(versions)} 个测试版本")
    except Exception as e:
        print(f"✗ 清理失败: {e}")
    
    print()
    print("=" * 60)
    print("测试完成！")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_version_persistence())
