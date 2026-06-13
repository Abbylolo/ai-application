/**
 * Supabase 数据操作层
 * 通过后端 /api/db/* 代理访问 Supabase
 */
import db from '@/db/database.js'

const BASE = '/api/db'

// ========== 用户档案 ==========

export async function getProfiles() {
  const res = await fetch(`${BASE}/profiles`)
  return res.json()
}

export async function saveProfile(profile) {
  // 为 Supabase 转换字段名(camelCase → snake_case)和数据格式
  const body = {
    id: profile.id ? Number(profile.id) : undefined,
    name: profile.name,
    position: profile.position,
    years_of_experience: profile.yearsOfExperience,
    tech_stack: JSON.stringify(profile.techStack || []),
    projects: JSON.stringify(profile.projects || []),
    education: JSON.stringify(profile.education || {}),
    strengths: JSON.stringify(profile.strengths || []),
    weaknesses: JSON.stringify(profile.weaknesses || []),
    resume_raw: profile.resumeRaw
  }
  const res = await fetch(`${BASE}/profiles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  // 转换回前端格式
  return fromSupabaseProfile(data)
}

export async function deleteProfile(id) {
  await fetch(`${BASE}/profiles/${id}`, { method: 'DELETE' })
}

// ========== 模型配置 ==========

export async function getModelConfigs() {
  const res = await fetch(`${BASE}/model-configs`)
  const data = await res.json()
  if (data.error) return []
  return data.map(fromSupabaseConfig)
}

export async function saveModelConfig(config) {
  const body = {
    id: String(config.id),
    name: config.name,
    provider_type: config.providerType,
    endpoint: config.endpoint || '',
    api_key: config.apiKey,
    model_name: config.modelName,
    is_default: !!config.isDefault
  }
  const res = await fetch(`${BASE}/model-configs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return fromSupabaseConfig(data)
}

export async function deleteModelConfig(id) {
  await fetch(`${BASE}/model-configs/${id}`, { method: 'DELETE' })
}

// ========== 面试记录 ==========

export async function getInterviews() {
  const res = await fetch(`${BASE}/interviews`)
  const data = await res.json()
  if (data.error) return []
  return data.map(fromSupabaseInterview)
}

export async function saveInterview(interview) {
  const body = {
    id: interview.id ? Number(interview.id) : undefined,
    profile_id: interview.profileId,
    type: interview.type,
    company_name: interview.companyName,
    difficulty: interview.difficulty,
    review_mode: interview.reviewMode,
    status: interview.status,
    started_at: interview.startedAt,
    completed_at: interview.completedAt,
    total_questions: interview.totalQuestions,
    average_score: interview.averageScore,
    report_markdown: interview.reportMarkdown
  }
  const res = await fetch(`${BASE}/interviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return fromSupabaseInterview(data)
}

export async function deleteInterview(id) {
  await fetch(`${BASE}/interviews/${id}`, { method: 'DELETE' })
}

// ========== 面试问答 ==========

export async function getQA(interviewId) {
  const res = await fetch(`${BASE}/qa?interviewId=${interviewId}`)
  const data = await res.json()
  if (data.error) return []
  return data.map(fromSupabaseQA)
}

export async function saveQA(qa) {
  const body = {
    interview_id: qa.interviewId,
    sequence_number: qa.sequenceNumber,
    type: qa.type,
    question: qa.question ? JSON.stringify(qa.question) : null,
    user_answer: qa.userAnswer,
    evaluation: qa.evaluation ? JSON.stringify(qa.evaluation) : null,
    is_flagged: qa.isFlagged
  }
  const res = await fetch(`${BASE}/qa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return fromSupabaseQA(data)
}

export async function updateQA(id, updates) {
  const body = {}
  if (updates.userAnswer !== undefined) body.user_answer = updates.userAnswer
  if (updates.evaluation !== undefined) body.evaluation = JSON.stringify(updates.evaluation)
  if (updates.isFlagged !== undefined) body.is_flagged = updates.isFlagged
  body.updated_at = new Date().toISOString()

  await fetch(`${BASE}/qa/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

// ========== 公司题库 ==========

export async function getCompanyQuestions() {
  const res = await fetch(`${BASE}/company-questions`)
  const data = await res.json()
  if (data.error) return []
  return data.map(fromSupabaseCompany)
}

export async function saveCompanyQuestion(record) {
  const body = {
    company_name: record.companyName,
    position: record.position,
    jd_content: record.jdContent,
    source: record.source,
    questions: JSON.stringify(record.questions || []),
    tags: JSON.stringify(record.tags || [])
  }
  const res = await fetch(`${BASE}/company-questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return fromSupabaseCompany(data)
}

// ========== 格式转换: Supabase(snake_case) → 前端(camelCase) ==========

function fromSupabaseProfile(p) {
  return {
    id: p.id,
    name: p.name,
    position: p.position,
    yearsOfExperience: p.years_of_experience,
    techStack: safeJSON(p.tech_stack, []),
    projects: safeJSON(p.projects, []),
    education: safeJSON(p.education, {}),
    strengths: safeJSON(p.strengths, []),
    weaknesses: safeJSON(p.weaknesses, []),
    resumeRaw: p.resume_raw,
    createdAt: p.created_at ? new Date(p.created_at) : null,
    updatedAt: p.updated_at ? new Date(p.updated_at) : null
  }
}

function fromSupabaseConfig(c) {
  return {
    id: c.id,
    name: c.name,
    providerType: c.provider_type,
    endpoint: c.endpoint,
    apiKey: c.api_key,
    modelName: c.model_name,
    isDefault: c.is_default,
    createdAt: new Date(c.created_at)
  }
}

function fromSupabaseInterview(i) {
  return {
    id: i.id,
    profileId: i.profile_id,
    type: i.type,
    companyName: i.company_name,
    difficulty: i.difficulty,
    reviewMode: i.review_mode || 'instant',
    status: i.status,
    startedAt: i.started_at ? new Date(i.started_at) : null,
    completedAt: i.completed_at ? new Date(i.completed_at) : null,
    totalQuestions: i.total_questions,
    averageScore: i.average_score,
    reportMarkdown: i.report_markdown
  }
}

function fromSupabaseQA(q) {
  return {
    id: q.id,
    interviewId: q.interview_id,
    sequenceNumber: q.sequence_number,
    type: q.type,
    question: safeJSON(q.question, {}),
    userAnswer: q.user_answer,
    evaluation: safeJSON(q.evaluation, null),
    isFlagged: q.is_flagged,
    createdAt: q.created_at ? new Date(q.created_at) : null
  }
}

function fromSupabaseCompany(c) {
  return {
    id: c.id,
    companyName: c.company_name,
    position: c.position,
    jdContent: c.jd_content,
    source: c.source,
    questions: safeJSON(c.questions, []),
    tags: safeJSON(c.tags, []),
    createdAt: c.created_at ? new Date(c.created_at) : null,
    updatedAt: c.updated_at ? new Date(c.updated_at) : null
  }
}

function safeJSON(val, fallback) {
  if (!val) return fallback
  if (typeof val === 'object') return val
  try { return JSON.parse(val) } catch { return fallback }
}
