"""
测试反馈功能的 Supabase 连接
"""
import asyncio
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

async def test_feedback_connection():
    """测试反馈功能连接"""
    print("=" * 60)
    print("测试反馈功能 Supabase 连接")
    print("=" * 60)
    
    # 1. 检查环境变量
    print("\n1. 检查环境变量:")
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    dev_mode = os.getenv("DEV_MODE", "false").lower() == "true"
    environment = os.getenv("ENVIRONMENT", "development")
    
    print(f"   SUPABASE_URL: {supabase_url[:30]}..." if supabase_url else "   SUPABASE_URL: 未设置")
    print(f"   SUPABASE_KEY: {'已设置' if supabase_key else '未设置'}")
    print(f"   DEV_MODE: {dev_mode}")
    print(f"   ENVIRONMENT: {environment}")
    
    if dev_mode:
        print("\n   ⚠️  警告: DEV_MODE=true，将使用模拟数据（票数写死）")
        print("   💡 提示: 生产环境应该设置 DEV_MODE=false")
    
    if not supabase_url or not supabase_key:
        print("\n   ❌ Supabase 配置缺失，将使用模拟数据")
        return
    
    # 2. 测试 Supabase 连接
    print("\n2. 测试 Supabase 连接:")
    try:
        from supabase import create_client
        client = create_client(supabase_url, supabase_key)
        print("   ✅ Supabase 客户端创建成功")
    except Exception as e:
        print(f"   ❌ Supabase 客户端创建失败: {e}")
        return
    
    # 3. 测试查询 feature_options 表
    print("\n3. 测试查询 feature_options 表:")
    try:
        response = client.table("feature_options").select("*").limit(1).execute()
        print(f"   ✅ 查询成功，返回 {len(response.data)} 条记录")
        if response.data:
            print(f"   示例数据: {response.data[0].get('name', 'N/A')}")
    except Exception as e:
        print(f"   ❌ 查询失败: {e}")
        print("   💡 提示: 请确认已执行 create_feedback_tables.sql")
        return
    
    # 4. 测试查询 user_votes 表
    print("\n4. 测试查询 user_votes 表:")
    try:
        response = client.table("user_votes").select("*").limit(5).execute()
        print(f"   ✅ 查询成功，当前有 {len(response.data)} 条投票记录")
    except Exception as e:
        print(f"   ❌ 查询失败: {e}")
        return
    
    # 5. 测试获取功能选项（包含票数统计）
    print("\n5. 测试获取功能选项（包含票数统计）:")
    try:
        from app.services.feedback_service import FeedbackService
        service = FeedbackService()
        
        # 检查是否会使用模拟数据
        if not service.supabase:
            print("   ⚠️  警告: FeedbackService.supabase 为 None")
            print("   原因: DEV_MODE=true 或 Supabase 配置缺失")
            print("   结果: 将返回模拟数据（票数写死）")
        else:
            print("   ✅ FeedbackService.supabase 已初始化")
            
            # 获取功能选项
            options = await service.get_feature_options()
            print(f"   ✅ 获取到 {len(options)} 个功能选项")
            
            # 显示前 3 个选项的票数
            print("\n   票数统计:")
            for i, option in enumerate(options[:3], 1):
                print(f"   {i}. {option['name']}: {option['vote_count']} 票")
    except Exception as e:
        print(f"   ❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return
    
    print("\n" + "=" * 60)
    print("测试完成")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_feedback_connection())
