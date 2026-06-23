-- 扩展公司题库：保存 JD 解析结果和面经检索结果

ALTER TABLE company_question_bank
  ADD COLUMN IF NOT EXISTS jd_parsed JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS search_results JSONB DEFAULT '[]';
