"""
框架匹配 API - Vercel Serverless Function
"""
from http.server import BaseHTTPRequestHandler
import json
import sys
import os

# 添加当前目录到 Python 路径
sys.path.insert(0, os.path.dirname(__file__))

from _config import get_settings, get_cached_service
from _services.llm_factory import LLMFactory
from _services.framework_matcher import FrameworkMatcher


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
            if "input" not in data or len(data["input"]) < 10:
                self._error_response("输入至少需要 10 个字符", 400)
                return
            
            user_input = data["input"]
            model = data.get("model", "deepseek")
            user_type = data.get("user_type", "free")
            
            # 验证模型类型
            if model not in LLMFactory.get_supported_models():
                self._error_response(f"不支持的模型类型: {model}", 400)
                return
            
            # 获取 LLM 服务和框架匹配器
            settings = get_settings()
            llm_service = get_cached_service(
                f"llm_{model}",
                lambda: LLMFactory.create_service(model, settings)
            )
            matcher = get_cached_service(
                f"matcher_{model}",
                lambda: FrameworkMatcher(llm_service)
            )
            
            # 执行匹配（同步调用异步函数）
            import asyncio
            candidates = asyncio.run(matcher.match_frameworks(user_input, user_type))
            
            # 返回结果
            self._json_response({
                "frameworks": [c.dict() for c in candidates]
            })
            
        except Exception as e:
            self._error_response(f"框架匹配失败: {str(e)}", 500)
    
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
