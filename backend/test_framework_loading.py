"""测试框架描述加载"""
import os
import sys

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.framework_matcher import FrameworkMatcher
from app.services.llm_service import DeepSeekService

# 创建一个简单的 LLM 服务实例（不需要真实调用）
class MockLLMService:
    async def analyze_intent(self, user_input: str, frameworks_context: str):
        return ["CRISPE", "BAB", "SPEAR"]

# 测试框架描述加载
matcher = FrameworkMatcher(MockLLMService())

print("=" * 80)
print("测试框架描述加载")
print("=" * 80)

# 打印加载的框架数量
print(f"\n加载的框架数量: {len(matcher.frameworks_descriptions)}")

# 打印前 10 个框架的描述
print("\n前 10 个框架:")
for i, (name, desc) in enumerate(list(matcher.frameworks_descriptions.items())[:10]):
    print(f"\n{i+1}. {name}")
    print(f"   描述: {desc[:100]}...")

# 测试特定框架
test_frameworks = ["CRISPE Framework", "BAB Framework", "SPEAR Framework", "RACEF Framework"]
print("\n" + "=" * 80)
print("测试特定框架:")
print("=" * 80)

for fw in test_frameworks:
    desc = matcher.frameworks_descriptions.get(fw)
    if desc:
        print(f"\n✅ {fw}")
        print(f"   {desc}")
    else:
        print(f"\n❌ {fw} - 未找到描述")

# 测试不带 Framework 后缀的名称
print("\n" + "=" * 80)
print("测试不带 Framework 后缀:")
print("=" * 80)

for fw in ["CRISPE", "BAB", "SPEAR", "RACEF"]:
    desc = matcher.frameworks_descriptions.get(fw)
    if desc:
        print(f"\n✅ {fw}")
        print(f"   {desc}")
    else:
        print(f"\n❌ {fw} - 未找到描述")
