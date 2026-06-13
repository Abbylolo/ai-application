-- 用户头像字段
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT '👤';
