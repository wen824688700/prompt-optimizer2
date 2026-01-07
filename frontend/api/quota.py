"""
配额查询 API - Vercel Serverless Function
"""
from http.server import BaseHTTPRequestHandler
import json
import sys
import os
from urllib.parse import parse_qs, urlparse

# 添加当前目录到 Python 路径
sys.path.insert(0, os.path.dirname(__file__))

from _config import get_cached_service
from _services.quota_manager import QuotaManager


class handler(BaseHTTPRequestHandler):
    """Vercel Serverless Function 处理器"""
    
    def do_OPTIONS(self):
        """处理 CORS 预检请求"""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
    
    def do_GET(self):
        """处理 GET 请求"""
        try:
            # 解析查询参数
            parsed_url = urlparse(self.path)
            params = parse_qs(parsed_url.query)
            
            user_id = params.get("user_id", ["test_user"])[0]
            account_type = params.get("account_type", ["free"])[0]
            timezone_offset = int(params.get("timezone_offset", ["0"])[0])
            
            # 获取配额管理器
            quota_manager = get_cached_service("quota_manager", QuotaManager)
            
            # 查询配额
            import asyncio
            status = asyncio.run(
                quota_manager.check_quota(user_id, account_type, timezone_offset)
            )
            
            # 返回结果
            self._json_response({
                "used": status.used,
                "total": status.total,
                "reset_time": status.reset_time.isoformat(),
                "can_generate": status.can_generate
            })
            
        except Exception as e:
            self._error_response(f"获取配额信息失败: {str(e)}", 500)
    
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
