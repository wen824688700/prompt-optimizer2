-- 创建版本表
CREATE TABLE IF NOT EXISTS versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  version_number TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('save', 'optimize')),
  description TEXT,
  topic TEXT,
  framework_id TEXT,
  framework_name TEXT,
  original_input TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_versions_user_id ON versions(user_id);
CREATE INDEX IF NOT EXISTS idx_versions_created_at ON versions(created_at DESC);

-- 启用 RLS
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
DROP POLICY IF EXISTS "用户只能访问自己的版本" ON versions;
CREATE POLICY "用户只能访问自己的版本"
  ON versions FOR ALL
  USING (user_id = auth.uid()::text);

-- 添加注释
COMMENT ON TABLE versions IS '用户的提示词版本历史';
COMMENT ON COLUMN versions.type IS '版本类型：save（手动保存）或 optimize（自动生成）';
COMMENT ON COLUMN versions.topic IS '主题标签，从原始输入提取';
