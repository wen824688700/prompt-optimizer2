"""
Vercel Serverless Functions 工具函数
"""
from http.server import BaseHTTPRequestHandler
import json
from typing import Any, Dict


def json_response(handler: BaseHTTPRequestHandler, data: Any, status: int = 200):
    """
    发送 JSON 响应
    
    Args:
        handler: HTTP 请求处理器
        data: 响应数据
        status: HTTP 状态码
    """
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
    handler.end_headers()
    
    response_body = json.dumps(data, ensure_ascii=False)
    handler.wfile.write(response_body.encode("utf-8"))


def error_response(handler: BaseHTTPRequestHandler, message: str, status: int = 500):
    """
    发送错误响应
    
    Args:
        handler: HTTP 请求处理器
        message: 错误消息
        status: HTTP 状态码
    """
    json_response(handler, {"error": message}, status)


def parse_json_body(handler: BaseHTTPRequestHandler) -> Dict:
    """
    解析 JSON 请求体
    
    Args:
        handler: HTTP 请求处理器
    
    Returns:
        解析后的 JSON 数据
    """
    content_length = int(handler.headers.get("Content-Length", 0))
    if content_length == 0:
        return {}
    
    body = handler.rfile.read(content_length)
    return json.loads(body.decode("utf-8"))


def handle_cors(handler: BaseHTTPRequestHandler):
    """
    处理 CORS 预检请求
    
    Args:
        handler: HTTP 请求处理器
    """
    handler.send_response(200)
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
    handler.end_headers()
