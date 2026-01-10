-- 修复反馈表：删除重复数据并重建表
-- 执行方式：在 Supabase SQL Editor 中运行此脚本

-- 1. 删除旧表（包括所有数据）
DROP TABLE IF EXISTS user_votes CASCADE;
DROP TABLE IF EXISTS user_feedback CASCADE;
DROP TABLE IF EXISTS feature_options CASCADE;

-- 2. 重新创建功能选项表
CREATE TABLE feature_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  display_order INT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 重新创建用户投票表（user_id 改为 TEXT 类型）
CREATE TABLE user_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,  -- TEXT 类型，支持任意用户 ID 格式
  option_id UUID NOT NULL REFERENCES feature_options(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, option_id)
);

-- 4. 重新创建用户反馈表（user_id 改为 TEXT 类型）
CREATE TABLE user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,  -- TEXT 类型，支持任意用户 ID 格式
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 创建索引以提高查询性能
CREATE INDEX idx_user_votes_user_id ON user_votes(user_id);
CREATE INDEX idx_user_votes_option_id ON user_votes(option_id);
CREATE INDEX idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX idx_feature_options_active ON feature_options(is_active, display_order);

-- 6. 插入功能选项数据（只插入一次，不重复）
INSERT INTO feature_options (name, description, display_order) VALUES
('多模型支持（GPT-4, Claude, Gemini 等）', '支持多种 AI 模型进行提示词优化', 1),
('场景模板库（营销、代码、教育等预设模板）', '提供各种场景的预设模板，快速开始', 2),
('新场景支持：生图提示词（Midjourney、SD 等）', '支持生图场景的提示词优化', 3),
('多语言支持（英文、日文等）', '支持多种语言的提示词优化', 4),
('API 接口（供开发者集成）', '提供 API 接口供开发者集成到自己的应用', 5),
('其他（请在下方反馈区填写）', '如有其他想法，欢迎在反馈区告诉我们', 6);

-- 7. 启用 Row Level Security (RLS)
ALTER TABLE feature_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- 8. 删除旧的 RLS 策略（如果存在）
DROP POLICY IF EXISTS "feature_options_select_policy" ON feature_options;
DROP POLICY IF EXISTS "user_votes_select_policy" ON user_votes;
DROP POLICY IF EXISTS "user_votes_insert_policy" ON user_votes;
DROP POLICY IF EXISTS "user_votes_delete_policy" ON user_votes;
DROP POLICY IF EXISTS "user_feedback_select_policy" ON user_feedback;
DROP POLICY IF EXISTS "user_feedback_insert_policy" ON user_feedback;

-- 9. 创建新的 RLS 策略（允许 service_role 完全访问）

-- feature_options: 所有人可读
CREATE POLICY "feature_options_select_policy" ON feature_options
  FOR SELECT USING (true);

-- user_votes: 允许所有操作（由后端 service_role key 控制）
CREATE POLICY "user_votes_select_policy" ON user_votes
  FOR SELECT USING (true);

CREATE POLICY "user_votes_insert_policy" ON user_votes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "user_votes_delete_policy" ON user_votes
  FOR DELETE USING (true);

-- user_feedback: 允许所有操作（由后端 service_role key 控制）
CREATE POLICY "user_feedback_select_policy" ON user_feedback
  FOR SELECT USING (true);

CREATE POLICY "user_feedback_insert_policy" ON user_feedback
  FOR INSERT WITH CHECK (true);

-- 10. 创建视图：统计每个选项的投票数
CREATE OR REPLACE VIEW feature_options_with_votes AS
SELECT 
  fo.id,
  fo.name,
  fo.description,
  fo.display_order,
  fo.is_active,
  fo.created_at,
  COUNT(uv.id) as vote_count
FROM feature_options fo
LEFT JOIN user_votes uv ON fo.id = uv.option_id
GROUP BY fo.id, fo.name, fo.description, fo.display_order, fo.is_active, fo.created_at
ORDER BY fo.display_order;

-- 完成！
-- 现在应该只有 6 个功能选项，没有重复数据
