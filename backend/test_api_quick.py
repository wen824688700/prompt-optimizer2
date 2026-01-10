"""
快速测试 API
"""
import requests
import time

print("测试反馈 API...")

try:
    # 测试获取功能选项
    print("\n1. 测试 GET /api/v1/feedback/options")
    response = requests.get("http://127.0.0.1:8000/api/v1/feedback/options", timeout=10)
    print(f"   状态码: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ 成功获取 {len(data)} 个功能选项")
        
        # 显示前 3 个选项的票数
        print("\n   票数统计:")
        for i, option in enumerate(data[:3], 1):
            print(f"   {i}. {option['name']}: {option['vote_count']} 票")
    else:
        print(f"   ❌ 失败: {response.text}")
        
except Exception as e:
    print(f"   ❌ 错误: {e}")
    import traceback
    traceback.print_exc()

print("\n完成！")
