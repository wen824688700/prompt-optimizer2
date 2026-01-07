"""
数据库连接模块
为 Serverless 环境优化的数据库连接管理
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
from contextlib import contextmanager
from ._config import get_settings


# 使用 NullPool 避免连接池问题（Serverless 环境不需要连接池）
def get_engine():
    """创建数据库引擎"""
    settings = get_settings()
    return create_engine(
        settings.database_url,
        poolclass=NullPool,  # 不使用连接池
        echo=False
    )


def get_session_factory():
    """创建 Session 工厂"""
    engine = get_engine()
    return sessionmaker(bind=engine, autocommit=False, autoflush=False)


@contextmanager
def get_db_session() -> Session:
    """
    获取数据库会话（上下文管理器）
    
    使用示例：
        with get_db_session() as db:
            # 使用 db 进行数据库操作
            pass
    """
    SessionLocal = get_session_factory()
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
