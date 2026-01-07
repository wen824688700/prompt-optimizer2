"""
Framework Matcher Service for matching user input to appropriate frameworks
"""
import os
import glob
from typing import List
from pydantic import BaseModel
import logging

from .base_llm import BaseLLMService

logger = logging.getLogger(__name__)


class FrameworkCandidate(BaseModel):
    """框架候选模型"""
    id: str
    name: str
    description: str
    match_score: float = 1.0
    reasoning: str = ""


class UserType:
    """用户类型枚举"""
    FREE = "free"
    PRO = "pro"


class FrameworkMatcher:
    """根据用户输入匹配最合适的 Prompt 框架"""
    
    def __init__(self, llm_service: BaseLLMService):
        self.llm_service = llm_service
        self.frameworks_summary = self._load_frameworks_summary()
        self.frameworks_descriptions = self._load_frameworks_descriptions()
    
    def _load_frameworks_summary(self) -> str:
        """加载 Frameworks_Summary.md 表格"""
        try:
            # 获取项目根目录
            current_dir = os.path.dirname(os.path.abspath(__file__))
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
            
            # 构建文件路径
            summary_path = os.path.join(
                project_root,
                "skills-main",
                "skills",
                "prompt-optimizer",
                "references",
                "Frameworks_Summary.md"
            )
            
            with open(summary_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            logger.info(f"Loaded frameworks summary from {summary_path}")
            return content
            
        except FileNotFoundError:
            logger.error(f"Frameworks_Summary.md not found at {summary_path}")
            # 返回一个简化的框架列表作为后备
            return """
# AI 提示词框架摘要

| 序号 | 框架名称 | 应用场景 |
|:---:|----------|----------|
| 1 | RACEF Framework | 头脑风暴和创意生成、数据分析和市场研究 |
| 2 | CRISPE Framework | 营销活动策划、员工培训计划设计 |
| 3 | BAB Framework | 订阅服务推广、健身应用营销 |
| 48 | Chain of Thought Framework | 数学问题求解、市场分析、科学现象解释 |
"""
        except Exception as e:
            logger.error(f"Error loading frameworks summary: {e}")
            raise
    
    def _load_frameworks_descriptions(self) -> dict:
        """加载所有框架的详细描述"""
        descriptions = {}
        try:
            # 获取项目根目录
            current_dir = os.path.dirname(os.path.abspath(__file__))
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
            
            # 构建框架目录路径
            frameworks_dir = os.path.join(
                project_root,
                "skills-main",
                "skills",
                "prompt-optimizer",
                "references",
                "frameworks"
            )
            
            # 遍历所有框架文件
            framework_files = glob.glob(os.path.join(frameworks_dir, "*.md"))
            
            for file_path in framework_files:
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read()
                    
                    # 提取框架名称和概述
                    framework_name = self._extract_framework_name(content)
                    overview = self._extract_overview(content)
                    
                    if framework_name and overview:
                        descriptions[framework_name] = overview
                        
                except Exception as e:
                    logger.warning(f"Error loading framework file {file_path}: {e}")
                    continue
            
            logger.info(f"Loaded {len(descriptions)} framework descriptions")
            return descriptions
            
        except Exception as e:
            logger.error(f"Error loading framework descriptions: {e}")
            return {}
    
    def _extract_framework_name(self, content: str) -> str:
        """从框架文档中提取框架名称"""
        lines = content.split('\n')
        for line in lines:
            if line.startswith('# ') and 'Framework' in line:
                return line.replace('# ', '').strip()
        return ""
    
    def _extract_overview(self, content: str) -> str:
        """从框架文档中提取概述部分"""
        lines = content.split('\n')
        overview_started = False
        overview_lines = []
        
        for line in lines:
            if line.startswith('## 概述'):
                overview_started = True
                continue
            elif overview_started:
                if line.startswith('##'):  # 遇到下一个章节，停止
                    break
                if line.strip():  # 跳过空行
                    overview_lines.append(line.strip())
        
        return ' '.join(overview_lines) if overview_lines else ""
    
    async def match_frameworks(
        self, 
        user_input: str, 
        user_type: str = UserType.FREE
    ) -> List[FrameworkCandidate]:
        """
        匹配 1-3 个最合适的框架
        
        Args:
            user_input: 用户输入的原始提示词或需求
            user_type: 用户类型（Free/Pro）
        
        Returns:
            1-3 个框架候选，按匹配度排序
        """
        try:
            # 调用 LLM 分析意图
            framework_ids = await self.llm_service.analyze_intent(
                user_input=user_input,
                frameworks_context=self.frameworks_summary
            )
            
            # 构建框架候选列表
            candidates = []
            for idx, framework_id in enumerate(framework_ids):
                # 尝试多种方式查找框架描述
                description = None
                
                # 1. 直接匹配
                description = self.frameworks_descriptions.get(framework_id)
                
                # 2. 添加 " Framework" 后缀尝试
                if not description:
                    description = self.frameworks_descriptions.get(f"{framework_id} Framework")
                
                # 3. 移除 " Framework" 后缀尝试
                if not description and framework_id.endswith(" Framework"):
                    base_name = framework_id.replace(" Framework", "")
                    description = self.frameworks_descriptions.get(base_name)
                
                # 4. 使用默认描述
                if not description:
                    description = f"适用于用户需求的 {framework_id} 框架"
                    logger.warning(f"No description found for framework: {framework_id}")
                
                candidate = FrameworkCandidate(
                    id=framework_id,
                    name=framework_id,
                    description=description,
                    match_score=1.0 - (idx * 0.1),  # 第一个得分最高
                    reasoning=f"基于用户输入分析，{framework_id} 最适合此场景"
                )
                candidates.append(candidate)
            
            logger.info(f"Matched {len(candidates)} frameworks for user input")
            return candidates
            
        except Exception as e:
            logger.error(f"Error matching frameworks: {e}")
            # 返回一个默认框架作为后备
            default_description = self.frameworks_descriptions.get(
                "RACEF Framework",
                "通用的头脑风暴和创意生成框架"
            )
            return [
                FrameworkCandidate(
                    id="RACEF",
                    name="RACEF Framework",
                    description=default_description,
                    match_score=1.0,
                    reasoning="默认推荐框架"
                )
            ]
