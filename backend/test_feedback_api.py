"""
测试反馈和投票 API
运行方式：python test_feedback_api.py
"""
import asyncio
import sys
from uuid import uuid4

# 添加 app 目录到路径
sys.path.insert(0, '.')

from app.services.feedback_service import FeedbackService


async def test_feedback_service():
    """测试反馈服务"""
    service = FeedbackService()
    
    print("=" * 60)
    print("测试反馈和投票服务")
    print("=" * 60)
    
    # 测试 1: 获取功能选项
    print("\n1. 获取功能选项...")
    try:
        options = await service.get_feature_options()
        print(f"✓ 成功获取 {len(options)} 个功能选项")
        for opt in options:
            print(f"  - {opt['name']}: {opt['vote_count']} 票")
    except Exception as e:
        print(f"✗ 失败: {e}")
    
    # 测试 2: 提交投票
    print("\n2. 提交投票...")
    try:
        test_user_id = str(uuid4())
        option_ids = [options[0]['id'], options[1]['id']]
        result = await service.submit_vote(test_user_id, option_ids)
        print(f"✓ 投票成功: {result['message']}")
    except Exception as e:
        print(f"✗ 失败: {e}")
    
    # 测试 3: 获取用户已投票的选项
    print("\n3. 获取用户已投票的选项...")
    try:
        options_with_votes = await service.get_feature_options(test_user_id)
        voted_options = [opt for opt in options_with_votes if opt['is_voted']]
        print(f"✓ 用户已投票 {len(voted_options)} 个选项")
        for opt in voted_options:
            print(f"  - {opt['name']}")
    except Exception as e:
        print(f"✗ 失败: {e}")
    
    # 测试 4: 提交反馈
    print("\n4. 提交反馈...")
    try:
        result = await service.submit_feedback(
            test_user_id,
            "这是一个测试反馈，希望能支持更多功能！"
        )
        print(f"✓ 反馈提交成功: {result['message']}")
    except Exception as e:
        print(f"✗ 失败: {e}")
    
    print("\n" + "=" * 60)
    print("测试完成！")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_feedback_service())
