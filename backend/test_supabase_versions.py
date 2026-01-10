"""
直接查询 Supabase 中的版本数据
"""
import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

async def check_versions_in_supabase():
    """检查 Supabase 中的版本数据"""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Supabase 配置不完整")
        return
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{supabase_url}/rest/v1/versions",
                headers={
                    "apikey": supabase_key,
                    "Authorization": f"Bearer {supabase_key}",
                },
                params={
                    "user_id": "eq.dev-user-001",
                    "order": "created_at.desc"
                }
            )
            
            print(f"✅ 查询成功: {response.status_code}")
            data = response.json()
            print(f"找到 {len(data)} 个版本")
            
            for i, version in enumerate(data, 1):
                print(f"\n版本 {i}:")
                print(f"  ID: {version['id']}")
                print(f"  版本号: {version['version_number']}")
                print(f"  类型: {version['type']}")
                print(f"  内容: {version['content'][:50]}...")
                print(f"  创建时间: {version['created_at']}")
            
            return True
    except Exception as e:
        print(f"❌ 查询失败: {e}")
        return False

if __name__ == "__main__":
    print("=== 直接查询 Supabase 中的版本数据 ===\n")
    asyncio.run(check_versions_in_supabase())
