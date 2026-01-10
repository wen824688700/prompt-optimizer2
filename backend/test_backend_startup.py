"""
测试后端启动是否正常
"""
import asyncio
import httpx

async def test_health():
    """测试健康检查端点"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get("http://127.0.0.1:8000/health")
            print(f"✅ 健康检查成功: {response.status_code}")
            print(f"响应: {response.json()}")
            return True
    except httpx.TimeoutException:
        print("❌ 请求超时")
        return False
    except Exception as e:
        print(f"❌ 请求失败: {e}")
        return False

if __name__ == "__main__":
    print("测试后端健康检查...")
    result = asyncio.run(test_health())
    if not result:
        print("\n后端可能卡住了，请检查日志")
