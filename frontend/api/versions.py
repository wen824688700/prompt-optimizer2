"""
版本管理 API - Vercel Serverless Function
"""
from http.server import BaseHTTPRequestHandler
import json
import sys
import os
from urllib.parse import parse_qs, urlparse

# 添加当前目录到 Python 路径
sys.path.insert(0, os.path.dirname(__file__))

from _config import get_cached_service
from _services.version_manager import VersionManager, VersionType


class handler(BaseHTTPRequestHandler):
    """Vercel Serverless Function 处理器"""
    
    def do_OPTIONS(self):
        """处理 CORS 预检请求"""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
    
    def do_GET(self):
        """处理 GET 请求 - 获取版本列表或单个版本"""
        try:
            # 解析路径
            parsed_url = urlparse(self.path)
            path_parts = parsed_url.path.strip("/").split("/")
            
            # 获取版本管理器
            version_manager = get_cached_service("version_manager", VersionManager)
            import asyncio
            
            # 判断是获取列表还是单个版本
            if len(path_parts) > 2 and path_parts[1] == "versions":
                # 获取单个版本: /api/versions/{version_id}
                version_id = path_parts[2]
                version = asyncio.run(version_manager.get_version(version_id))
                
                if version is None:
                    self._error_response("版本不存在", 404)
                    return
                
                self._json_response({
                    "id": version.id,
                    "user_id": version.user_id,
                    "content": version.content,
                    "type": version.type.value,
                    "created_at": version.created_at.isoformat(),
                    "formatted_title": version.formatted_title
                })
            else:
                # 获取版本列表
                params = parse_qs(parsed_url.query)
                user_id = params.get("user_id", ["test_user"])[0]
                limit = int(params.get("limit", ["10"])[0])
                
                versions = asyncio.run(
                    version_manager.get_versions(user_id, limit)
                )
                
                self._json_response([
                    {
                        "id": v.id,
                        "user_id": v.user_id,
                        "content": v.content,
                        "type": v.type.value,
                        "created_at": v.created_at.isoformat(),
                        "formatted_title": v.formatted_title
                    }
                    for v in versions
                ])
            
        except Exception as e:
            self._error_response(f"获取版本失败: {str(e)}", 500)
    
    def do_POST(self):
        """处理 POST 请求 - 保存版本或回滚"""
        try:
            # 解析路径
            parsed_url = urlparse(self.path)
            path_parts = parsed_url.path.strip("/").split("/")
            
            # 解析请求体
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode("utf-8"))
            
            # 获取版本管理器
            version_manager = get_cached_service("version_manager", VersionManager)
            import asyncio
            
            # 判断是保存还是回滚
            if len(path_parts) > 3 and path_parts[3] == "rollback":
                # 回滚: /api/versions/{version_id}/rollback
                version_id = path_parts[2]
                user_id = data.get("user_id", "test_user")
                
                try:
                    new_version = asyncio.run(
                        version_manager.rollback_version(user_id, version_id)
                    )
                    
                    self._json_response({
                        "id": new_version.id,
                        "user_id": new_version.user_id,
                        "content": new_version.content,
                        "type": new_version.type.value,
                        "created_at": new_version.created_at.isoformat(),
                        "formatted_title": new_version.formatted_title
                    })
                except ValueError as e:
                    self._error_response(str(e), 404)
                    return
            else:
                # 保存新版本
                user_id = data.get("user_id", "test_user")
                content = data.get("content")
                version_type_str = data.get("type", "save")
                
                if not content:
                    self._error_response("缺少必需字段: content", 400)
                    return
                
                version_type = VersionType.SAVE if version_type_str == "save" else VersionType.OPTIMIZE
                
                version = asyncio.run(
                    version_manager.save_version(user_id, content, version_type)
                )
                
                self._json_response({
                    "id": version.id,
                    "user_id": version.user_id,
                    "content": version.content,
                    "type": version.type.value,
                    "created_at": version.created_at.isoformat(),
                    "formatted_title": version.formatted_title
                })
            
        except Exception as e:
            self._error_response(f"操作失败: {str(e)}", 500)
    
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
