"""
直接测试 Supabase 连接和查询
"""
import os
from dotenv import load_dotenv

load_dotenv()

def test_supabase_connection():
    """测试 Supabase 连接"""
    print("=" * 60)
    print("直接测试 Supabase 连接")
    print("=" * 60)
    
    # 1. 检查环境变量
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    print(f"\n1. 环境变量:")
    print(f"   SUPABASE_URL: {supabase_url}")
    print(f"   SUPABASE_KEY: {'已设置' if supabase_key else '未设置'}")
    print(f"   Key 长度: {len(supabase_key) if supabase_key else 0}")
    print(f"   Key 前缀: {supabase_key[:30] if supabase_key else 'None'}...")
    
    if not supabase_url or not supabase_key:
        print("\n❌ 环境变量未设置")
        return
    
    # 2. 创建客户端
    print(f"\n2. 创建 Supabase 客户端:")
    try:
        from supabase import create_client
        client = create_client(supabase_url, supabase_key)
        print(f"   ✅ 客户端创建成功")
    except Exception as e:
        print(f"   ❌ 客户端创建失败: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # 3. 测试查询 feature_options 表
    print(f"\n3. 测试查询 feature_options 表:")
    try:
        response = client.table("feature_options").select("*").execute()
        print(f"   ✅ 查询成功")
        print(f"   返回 {len(response.data)} 条记录")
        if response.data:
            print(f"   第一条记录: {response.data[0].get('name', 'N/A')}")
    except Exception as e:
        print(f"   ❌ 查询失败: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # 4. 测试查询 user_votes 表
    print(f"\n4. 测试查询 user_votes 表:")
    try:
        response = client.table("user_votes").select("*").limit(5).execute()
        print(f"   ✅ 查询成功")
        print(f"   返回 {len(response.data)} 条记录")
    except Exception as e:
        print(f"   ❌ 查询失败: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # 5. 测试统计投票数
    print(f"\n5. 测试统计投票数:")
    try:
        # 获取所有选项
        options_response = client.table("feature_options").select("*").execute()
        options = options_response.data
        
        print(f"   功能选项数量: {len(options)}")
        
        for option in options[:3]:  # 只显示前3个
            # 统计每个选项的投票数
            votes_response = client.table("user_votes")\
                .select("id", count="exact")\
                .eq("option_id", option["id"])\
                .execute()
            
            vote_count = votes_response.count or 0
            print(f"   - {option['name']}: {vote_count} 票")
        
        print(f"   ✅ 统计成功")
    except Exception as e:
        print(f"   ❌ 统计失败: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return
    
    print("\n" + "=" * 60)
    print("✅ 所有测试通过！")
    print("=" * 60)

if __name__ == "__main__":
    test_supabase_connection()
