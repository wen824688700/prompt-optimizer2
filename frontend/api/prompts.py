"""
提示词生成 API - Vercel Serverless Function
"""
from http.server import BaseHTTPRequestHandler
import json
import sys
import os
import glob

# 添加当前目录到 Python 路径
sys.path.insert(0, os.path.dirname(__file__))

from _config import get_settings, get_cached_service
from _services.llm_factory import LLMFactory
from _services.quota_manager import QuotaManager
from _services.version_manager import VersionManager, VersionType


def _load_framework_doc(framework_id: str) -> str:
    """加载框架文档"""
    try:
        # 获取项目根目录（Vercel 环境）
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(current_dir)
        
        # 构建框架目录路径
        frameworks_dir = os.path.join(
            project_root,
            "skills-main",
            "skills",
            "prompt-optimizer",
            "references",
            "frameworks"
        )
        
        # 查找匹配的框架文件
        pattern = os.path.join(frameworks_dir, f"*_{framework_id.replace(' ', '_')}_Framework.md")
        matching_files = glob.glob(pattern)
        
        if not matching_files:
            # 返回基本框架文档
            return f"""# {framework_id} Framework

## 概述
这是 {framework_id} 框架的基本说明。

## 应用场景
适用于各种提示词优化场景。

## 框架构成
请根据用户需求和框架特点生成优化后的提示词。
"""
        
        # 读取第一个匹配的文件
        with open(matching_files[0], "r", encoding="utf-8") as f:
            return f.read()
            
    except Exception:
        return f"""# {framework_id} Framework

## 概述
这是 {framework_id} 框架的基本说明。
"""


class handler(BaseHTTPRequestHandler):
    """Vercel Serverless Function 处理器"""
    
    def do_OPTIONS(self):
        """处理 CORS 预检请求"""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
    
    def do_POST(self):
        """处理 POST 请求"""
        try:
            # 解析请求体
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode("utf-8"))
            
            # 验证必需字段
            required_fields = ["input", "framework_id", "clarification_answers"]
            for field in required_fields:
                if field not in data:
                    self._error_response(f"缺少必需字段: {field}", 400)
                    return
            
            user_input = data["input"]
            framework_id = data["framework_id"]
            clarification_answers = data["clarification_answers"]
            attachment_content = data.get("attachment_content")
            user_id = data.get("user_id", "test_user")
            account_type = data.get("account_type", "free")
            model = data.get("model", "deepseek")
            
            # 验证模型类型
            if model not in LLMFactory.get_supported_models():
                self._error_response(f"不支持的模型类型: {model}", 400)
                return
            
            # 获取服务实例
            settings = get_settings()
            quota_manager = get_cached_service("quota_manager", QuotaManager)
            version_manager = get_cached_service("version_manager", VersionManager)
            llm_service = get_cached_service(
                f"llm_{model}",
                lambda: LLMFactory.create_service(model, settings)
            )
            
            # 检查配额
            import asyncio
            can_generate = asyncio.run(
                quota_manager.consume_quota(user_id, account_type)
            )
            
            if not can_generate:
                quota_status = asyncio.run(
                    quota_manager.check_quota(user_id, account_type)
                )
                self._json_response({
                    "code": "QUOTA_EXCEEDED",
                    "message": f"您已达到每日配额限制（{quota_status.total}次）",
                    "quota": {
                        "used": quota_status.used,
                        "total": quota_status.total,
                        "reset_time": quota_status.reset_time.isoformat()
                    }
                }, 403)
                return
            
            # 加载框架文档
            framework_doc = _load_framework_doc(framework_id)
            
            # 生成提示词
            generated_output = asyncio.run(
                llm_service.generate_prompt(
                    user_input=user_input,
                    framework_doc=framework_doc,
                    clarification_answers=clarification_answers,
                    attachment_content=attachment_content
                )
            )
            
            # 保存版本
            version = asyncio.run(
                version_manager.save_version(
                    user_id=user_id,
                    content=generated_output,
                    version_type=VersionType.OPTIMIZE
                )
            )
            
            # 返回结果
            self._json_response({
                "output": generated_output,
                "framework_used": framework_id,
                "version_id": version.id
            })
            
        except Exception as e:
            self._error_response(f"提示词生成失败: {str(e)}", 500)
    
    def _json_response(self, data, status=200):
        """发送 JSON 响应"""
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        response_body = json.dumps(data, ensure_ascii=False)
        self.wfile.write(response_body.encode("utf-8"))
    
    def _error_response(self, message, status=500):
        """发送错误响应"""
        self._json_response({"error": message}, status)
