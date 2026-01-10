"""
测试数据库连接
"""
import os
from dotenv import load_dotenv

load_dotenv()

def test_connection():
    """测试数据库连接"""
    database_url = os.getenv("DATABASE_URL")
    print(f"DATABASE_URL: {database_url}")
    print()
    
    # 测试 psycopg
    print("测试 psycopg (v3):")
    try:
        import psycopg
        from psycopg.rows import dict_row
        
        print(f"  正在连接...")
        conn = psycopg.connect(database_url, row_factory=dict_row)
        print(f"  ✅ 连接成功")
        
        # 测试查询
        cursor = conn.cursor()
        cursor.execute("SELECT version()")
        result = cursor.fetchone()
        print(f"  PostgreSQL 版本: {result['version'][:50]}...")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"  ❌ 连接失败: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_connection()
