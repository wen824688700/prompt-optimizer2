"""
速率限制中间件
防止滥用和恶意请求
"""
import hashlib
import time
from typing import Dict, Optional
from fastapi import Request, HTTPException
from collections import defaultdict
import asyncio

# 内存存储（生产环境应使用 Redis）
request_counts: Dict[str, Dict[str, any]] = defaultdict(dict)
user_locks: Dict[str, asyncio.Lock] = {}


def get_client_identifier(request: Request, user_id: Optional[str] = None) -> str:
    """
    获取客户端唯一标识
    
    Args:
        request: FastAPI 请求对象
        user_id: 用户 ID（如果已登录）
    
    Returns:
        客户端唯一标识字符串
    """
    # 获取真实 IP（考虑代理）
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else "unknown"
    
    # 获取 User-Agent 作为浏览器指纹的一部分
    user_agent = request.headers.get("User-Agent", "")
    
    if user_id:
        # 已登录用户：user_id + IP
        identifier = f"user:{user_id}:ip:{ip}"
    else:
        # 未登录用户：IP + User-Agent 哈希
        ua_hash = hashlib.md5(user_agent.encode()).hexdigest()[:8]
        identifier = f"anon:ip:{ip}:ua:{ua_hash}"
    
    return identifier


async def check_rate_limit(
    identifier: str,
    max_requests: int = 10,
    window_seconds: int = 60,
    user_id: Optional[str] = None
) -> bool:
    """
    检查速率限制
    
    Args:
        identifier: 客户端标识
        max_requests: 时间窗口内最大请求数
        window_seconds: 时间窗口（秒）
        user_id: 用户 ID（用于检测异常行为）
    
    Returns:
        是否允许请求
    
    Raises:
        HTTPException: 超过速率限制时抛出 429 错误
    """
    current_time = time.time()
    
    # 获取或初始化请求记录
    if identifier not in request_counts:
        request_counts[identifier] = {
            "requests": [],
            "blocked_until": 0
        }
    
    record = request_counts[identifier]
    
    # 检查是否在封禁期内
    if current_time < record["blocked_until"]:
        remaining = int(record["blocked_until"] - current_time)
        raise HTTPException(
            status_code=429,
            detail=f"请求过于频繁，请在 {remaining} 秒后重试"
        )
    
    # 清理过期的请求记录
    record["requests"] = [
        req_time for req_time in record["requests"]
        if current_time - req_time < window_seconds
    ]
    
    # 检查是否超过限制
    if len(record["requests"]) >= max_requests:
        # 封禁一段时间（渐进式封禁）
        block_duration = min(window_seconds * 2, 300)  # 最多封禁 5 分钟
        record["blocked_until"] = current_time + block_duration
        
        raise HTTPException(
            status_code=429,
            detail=f"请求过于频繁，已被暂时限制 {block_duration} 秒"
        )
    
    # 记录本次请求
    record["requests"].append(current_time)
    
    # 检测异常行为（同一用户多 IP）
    if user_id:
        await detect_suspicious_activity(user_id, identifier)
    
    return True


async def detect_suspicious_activity(user_id: str, identifier: str):
    """
    检测可疑活动（同一账号多 IP 访问）
    
    Args:
        user_id: 用户 ID
        identifier: 客户端标识
    """
    # 提取 IP
    ip = identifier.split(":ip:")[1].split(":")[0] if ":ip:" in identifier else "unknown"
    
    # 记录用户的 IP 列表
    user_key = f"user_ips:{user_id}"
    if user_key not in request_counts:
        request_counts[user_key] = {"ips": set(), "last_check": time.time()}
    
    user_record = request_counts[user_key]
    user_record["ips"].add(ip)
    
    # 每小时重置一次
    if time.time() - user_record["last_check"] > 3600:
        user_record["ips"] = {ip}
        user_record["last_check"] = time.time()
    
    # 如果同一用户在短时间内使用超过 3 个不同 IP，触发更严格限制
    if len(user_record["ips"]) > 3:
        # 可以在这里添加告警或更严格的限制
        pass


async def acquire_user_lock(user_id: str, timeout: float = 30.0) -> asyncio.Lock:
    """
    获取用户并发锁，防止同一用户并发生成
    
    Args:
        user_id: 用户 ID
        timeout: 超时时间（秒）
    
    Returns:
        用户锁对象
    
    Raises:
        HTTPException: 获取锁超时时抛出 409 错误
    """
    if user_id not in user_locks:
        user_locks[user_id] = asyncio.Lock()
    
    lock = user_locks[user_id]
    
    try:
        # 尝试获取锁，设置超时
        acquired = await asyncio.wait_for(lock.acquire(), timeout=timeout)
        if not acquired:
            raise HTTPException(
                status_code=409,
                detail="您有一个正在进行的生成任务，请等待完成后再试"
            )
        return lock
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=409,
            detail="您有一个正在进行的生成任务，请等待完成后再试"
        )


def cleanup_old_records():
    """
    清理过期的记录（定期调用）
    """
    current_time = time.time()
    expired_keys = []
    
    for key, record in request_counts.items():
        if isinstance(record, dict) and "requests" in record:
            # 清理 1 小时前的记录
            if record["requests"] and current_time - record["requests"][-1] > 3600:
                expired_keys.append(key)
    
    for key in expired_keys:
        del request_counts[key]
    
    # 清理未使用的锁
    inactive_locks = [
        user_id for user_id, lock in user_locks.items()
        if not lock.locked()
    ]
    for user_id in inactive_locks:
        if user_id in user_locks:
            del user_locks[user_id]
