-- 创建反馈和投票相关的数据表
-- 执行方式：在 Supabase SQL Editor 中运行此脚本

-- 1. 功能选项表
CREATE TABLE IF NOT EXISTS feature_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  display_order INT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 用户投票表
CREATE TABLE IF NOT EXISTS user_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES feature_options(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, option_id)
);

-- 3. 用户反馈表
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_votes_user_id ON user_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_votes_option_id ON user_votes(option_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_options_active ON feature_options(is_active, display_order);

-- 5. 初始化功能选项数据
INSERT INTO feature_options (name, description, display_order) VALUES
('多模型支持（GPT-4, Claude, Gemini 等）', '支持多种 AI 模型进行提示词优化', 1),
('场景模板库（营销、代码、教育等预设模板）', '提供各种场景的预设模板，快速开始', 2),
('新场景支持：生图提示词（Midjourney、SD 等）', '支持生图场景的提示词优化', 3),
('多语言支持（英文、日文等）', '支持多种语言的提示词优化', 4),
('API 接口（供开发者集成）', '提供 API 接口供开发者集成到自己的应用', 5),
('其他（请在下方反馈区填写）', '如有其他想法，欢迎在反馈区告诉我们', 6)
ON CONFLICT DO NOTHING;

-- 6. 启用 Row Level Security (RLS)
ALTER TABLE feature_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- 7. 创建 RLS 策略

-- feature_options: 所有人可读
CREATE POLICY "feature_options_select_policy" ON feature_options
  FOR SELECT USING (true);

-- user_votes: 用户只能查看和操作自己的投票
CREATE POLICY "user_votes_select_policy" ON user_votes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_votes_insert_policy" ON user_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_votes_delete_policy" ON user_votes
  FOR DELETE USING (auth.uid() = user_id);

-- user_feedback: 用户只能查看和创建自己的反馈
CREATE POLICY "user_feedback_select_policy" ON user_feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_feedback_insert_policy" ON user_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. 创建视图：统计每个选项的投票数（可选，用于管理后台）
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
-- 现在可以在应用中使用这些表了
