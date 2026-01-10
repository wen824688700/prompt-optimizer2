"""
测试版本 API
"""
import asyncio
import httpx

async def test_get_versions():
    """测试获取版本列表"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                "http://127.0.0.1:8000/api/v1/versions",
                params={"user_id": "dev-user-001"}
            )
            print(f"✅ 获取版本列表成功: {response.status_code}")
            data = response.json()
            print(f"版本数量: {len(data)}")
            if data:
                print(f"第一个版本: {data[0]}")
            return True
    except httpx.TimeoutException:
        print("❌ 请求超时")
        return False
    except Exception as e:
        print(f"❌ 请求失败: {e}")
        return False

async def test_save_version():
    """测试保存版本"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                "http://127.0.0.1:8000/api/v1/versions",
                json={
                    "user_id": "dev-user-001",
                    "content": "测试提示词内容",
                    "type": "save",
                    "version_number": "1.0",
                    "description": "测试版本"
                }
            )
            print(f"✅ 保存版本成功: {response.status_code}")
            data = response.json()
            print(f"版本 ID: {data['id']}")
            print(f"版本号: {data['version_number']}")
            return True
    except httpx.TimeoutException:
        print("❌ 请求超时")
        return False
    except Exception as e:
        print(f"❌ 请求失败: {e}")
        return False

if __name__ == "__main__":
    print("=== 测试获取版本列表 ===")
    asyncio.run(test_get_versions())
    
    print("\n=== 测试保存版本 ===")
    asyncio.run(test_save_version())
    
    print("\n=== 再次获取版本列表 ===")
    asyncio.run(test_get_versions())
