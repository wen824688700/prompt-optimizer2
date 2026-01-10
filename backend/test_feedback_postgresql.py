"""
测试反馈功能的 PostgreSQL 连接
"""
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def test_feedback_postgresql():
    """测试反馈功能 PostgreSQL 连接"""
    print("=" * 60)
    print("测试反馈功能 PostgreSQL 连接")
    print("=" * 60)
    
    # 1. 检查环境变量
    print("\n1. 检查环境变量:")
    database_url = os.getenv("DATABASE_URL")
    dev_mode = os.getenv("DEV_MODE", "false").lower() == "true"
    
    print(f"   DATABASE_URL: {'已设置' if database_url else '未设置'}")
    print(f"   DEV_MODE: {dev_mode}")
    
    if dev_mode:
        print("\n   ⚠️  警告: DEV_MODE=true，将使用模拟数据")
        return
    
    if not database_url:
        print("\n   ❌ DATABASE_URL 未设置")
        return
    
    # 2. 测试 FeedbackService
    print("\n2. 测试 FeedbackService:")
    try:
        from app.services.feedback_service import FeedbackService
        service = FeedbackService()
        
        # 获取功能选项
        print("   正在获取功能选项...")
        options = await service.get_feature_options()
        print(f"   ✅ 获取到 {len(options)} 个功能选项")
        
        # 显示前 3 个选项的票数
        print("\n   票数统计:")
        for i, option in enumerate(options[:3], 1):
            print(f"   {i}. {option['name']}: {option['vote_count']} 票")
        
        print("\n   ✅ 反馈功能测试通过！")
        
    except Exception as e:
        print(f"   ❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return
    
    print("\n" + "=" * 60)
    print("✅ 所有测试通过！")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_feedback_postgresql())
