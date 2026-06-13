-- 面试官 Agent 数据库初始化
-- Supabase PostgreSQL

-- 用户档案
CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT,
  position TEXT,
  years_of_experience INTEGER DEFAULT 0,
  tech_stack JSONB DEFAULT '[]',
  projects JSONB DEFAULT '[]',
  education JSONB DEFAULT '{}',
  strengths JSONB DEFAULT '[]',
  weaknesses JSONB DEFAULT '[]',
  resume_raw TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 模型配置
CREATE TABLE IF NOT EXISTS model_configs (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  provider_type TEXT DEFAULT 'anthropic',
  endpoint TEXT,
  api_key TEXT NOT NULL,
  model_name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 面试记录
CREATE TABLE IF NOT EXISTS interviews (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  profile_id INTEGER REFERENCES user_profiles(id),
  type TEXT DEFAULT 'general',
  company_name TEXT,
  difficulty TEXT DEFAULT 'mid',
  review_mode TEXT DEFAULT 'instant',
  status TEXT DEFAULT 'in_progress',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  total_questions INTEGER DEFAULT 0,
  average_score NUMERIC(3,1),
  report_markdown TEXT
);

-- 面试问答
CREATE TABLE IF NOT EXISTS interview_qa (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  interview_id INTEGER REFERENCES interviews(id) ON DELETE CASCADE,
  sequence_number INTEGER,
  type TEXT,
  question JSONB,
  user_answer TEXT,
  evaluation JSONB,
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 公司题库
CREATE TABLE IF NOT EXISTS company_question_bank (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  company_name TEXT NOT NULL,
  position TEXT,
  jd_content TEXT,
  source TEXT DEFAULT 'user_upload',
  questions JSONB DEFAULT '[]',
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
