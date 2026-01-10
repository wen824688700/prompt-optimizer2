"""
测试 Supabase SDK 连接
"""
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def test_supabase_sdk():
    """测试 Supabase SDK 连接"""
    print("=" * 60)
    print("测试 Supabase SDK 连接")
    print("=" * 60)
    
    # 1. 检查环境变量
    print("\n1. 检查环境变量:")
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    dev_mode = os.getenv("DEV_MODE", "false").lower() == "true"
    
    print(f"   SUPABASE_URL: {'已设置' if supabase_url else '未设置'}")
    print(f"   SUPABASE_KEY: {'已设置 (JWT 格式)' if supabase_key and supabase_key.startswith('eyJ') else '未设置或格式错误'}")
    print(f"   DEV_MODE: {dev_mode}")
    
    if dev_mode:
        print("\n   ⚠️  警告: DEV_MODE=true，将使用模拟数据")
        return
    
    if not supabase_url or not supabase_key:
        print("\n   ❌ Supabase 配置不完整")
        return
    
    # 2. 测试 Supabase 客户端初始化
    print("\n2. 测试 Supabase 客户端初始化:")
    try:
        from supabase import create_client
        from supabase.lib.client_options import ClientOptions
        
        print("   正在创建 Supabase 客户端...")
        options = ClientOptions(
            auto_refresh_token=True,
            persist_session=False
        )
        client = create_client(supabase_url, supabase_key, options=options)
        print("   ✅ Supabase 客户端创建成功")
        
    except Exception as e:
        print(f"   ❌ 客户端创建失败: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # 3. 测试 FeedbackService
    print("\n3. 测试 FeedbackService:")
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
    asyncio.run(test_supabase_sdk())
