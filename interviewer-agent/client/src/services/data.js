/**
 * Supabase 数据操作层
 * 通过后端 /api/db/* 代理访问 Supabase，自动携带 auth token
 */
import { getAccessToken } from './auth.js'
import { encrypt, decrypt } from '@/utils/crypto.js'

const BASE = '/api/db'

// 兼容旧数据：如果解密失败则返回原值（明文兼容）
async function safeDecrypt(value) {
  if (!value) return ''
  try { return await decrypt(value) }
  catch { return value }
}

async function authHeaders() {
  const token = await getAccessToken()
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  }
}

async function get(url) {
  const res = await fetch(url, { headers: await authHeaders() })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json
}

async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(body)
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data
}

async function put(url, body) {
  const res = await fetch(url, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(body)
  })
}

async function del(url) {
  await fetch(url, { method: 'DELETE', headers: await authHeaders() })
}

// ========== 用户档案 ==========

export async function getProfiles() {
  const data = await get(`${BASE}/profiles`)
  if (data.error) return []
  return data.map(fromSupabaseProfile)
}

export async function saveProfile(profile) {
  const body = toSupabaseProfile(profile)
  const data = await post(`${BASE}/profiles`, body)
  return fromSupabaseProfile(data)
}

export async function deleteProfile(id) {
  await del(`${BASE}/profiles/${id}`)
}

// ========== 模型配置 ==========

export async function getModelConfigs() {
  const data = await get(`${BASE}/model-configs`)
  if (data.error) return []
  const configs = data.map(fromSupabaseConfig)
  return Promise.all(configs.map(async (c) => ({
    ...c,
    apiKey: await safeDecrypt(c.apiKey)
  })))
}

export async function saveModelConfig(config) {
  const body = toSupabaseConfig(config)
  body.api_key = await encrypt(config.apiKey)
  const data = await post(`${BASE}/model-configs`, body)
  const result = fromSupabaseConfig(data)
  result.apiKey = config.apiKey  // 返回明文，避免调用方拿到密文
  return result
}

export async function deleteModelConfig(id) {
  await del(`${BASE}/model-configs/${id}`)
}

// ========== 面试记录 ==========

export async function getInterviews() {
  const data = await get(`${BASE}/interviews`)
  if (data.error) return []
  return data.map(fromSupabaseInterview)
}

export async function saveInterview(interview) {
  const body = toSupabaseInterview(interview)
  const data = await post(`${BASE}/interviews`, body)
  return fromSupabaseInterview(data)
}

export async function deleteInterview(id) {
  await del(`${BASE}/interviews/${id}`)
}

// ========== 面试问答 ==========

export async function getQA(interviewId) {
  const data = await get(`${BASE}/qa?interviewId=${interviewId}`)
  if (data.error) return []
  return data.map(fromSupabaseQA)
}

export async function saveQA(qa) {
  const body = toSupabaseQA(qa)
  const data = await post(`${BASE}/qa`, body)
  return fromSupabaseQA(data)
}

export async function updateQA(id, updates) {
  const body = {}
  if (updates.userAnswer !== undefined) body.user_answer = updates.userAnswer
  if (updates.evaluation !== undefined) body.evaluation = JSON.stringify(updates.evaluation)
  if (updates.isFlagged !== undefined) body.is_flagged = updates.isFlagged
  await put(`${BASE}/qa/${id}`, body)
}

// ========== 公司题库 ==========

export async function getCompanyQuestions() {
  const data = await get(`${BASE}/company-questions`)
  if (data.error) return []
  return data.map(fromSupabaseCompany)
}

export async function saveCompanyQuestion(record) {
  const body = toSupabaseCompany(record)
  const data = await post(`${BASE}/company-questions`, body)
  return fromSupabaseCompany(data)
}

// ========== 格式转换: 前端(camelCase) → Supabase(snake_case) ==========

function toSupabaseProfile(p) {
  return {
    id: p.id ? Number(p.id) : undefined,
    name: p.name, position: p.position,
    avatar: p.avatar || '👤',
    years_of_experience: p.yearsOfExperience,
    tech_stack: JSON.stringify(p.techStack || []),
    projects: JSON.stringify(p.projects || []),
    education: JSON.stringify(p.education || {}),
    strengths: JSON.stringify(p.strengths || []),
    weaknesses: JSON.stringify(p.weaknesses || []),
    resume_raw: p.resumeRaw
  }
}

function toSupabaseConfig(c) {
  return {
    id: String(c.id), name: c.name,
    provider_type: c.providerType, endpoint: c.endpoint || '',
    api_key: c.apiKey, model_name: c.modelName,
    is_default: !!c.isDefault
  }
}

function toSupabaseInterview(i) {
  return {
    id: i.id ? Number(i.id) : undefined,
    profile_id: i.profileId, type: i.type,
    company_name: i.companyName, difficulty: i.difficulty,
    review_mode: i.reviewMode, status: i.status,
    started_at: i.startedAt, completed_at: i.completedAt,
    total_questions: i.totalQuestions, average_score: i.averageScore,
    report_markdown: i.reportMarkdown
  }
}

function toSupabaseQA(q) {
  return {
    interview_id: q.interviewId, sequence_number: q.sequenceNumber,
    type: q.type, question: JSON.stringify(q.question || {}),
    user_answer: q.userAnswer,
    evaluation: q.evaluation ? JSON.stringify(q.evaluation) : null,
    is_flagged: q.isFlagged
  }
}

function toSupabaseCompany(c) {
  const questions = packCompanyQuestions(c)
  return {
    id: c.id ? Number(c.id) : undefined,
    company_name: c.companyName, position: c.position,
    jd_content: c.jdContent, source: c.source,
    questions: JSON.stringify(questions),
    tags: JSON.stringify(c.tags || [])
  }
}

// ========== 格式转换: Supabase(snake_case) → 前端(camelCase) ==========

function fromSupabaseProfile(p) {
  return {
    id: p.id, name: p.name, position: p.position,
    avatar: p.avatar || '👤',
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
    id: c.id, name: c.name, providerType: c.provider_type,
    endpoint: c.endpoint, apiKey: c.api_key,
    modelName: c.model_name, isDefault: c.is_default,
    createdAt: new Date(c.created_at)
  }
}

function fromSupabaseInterview(i) {
  return {
    id: i.id, profileId: i.profile_id, type: i.type,
    companyName: i.company_name, difficulty: i.difficulty,
    reviewMode: i.review_mode || 'instant', status: i.status,
    startedAt: i.started_at ? new Date(i.started_at) : null,
    completedAt: i.completed_at ? new Date(i.completed_at) : null,
    totalQuestions: i.total_questions, averageScore: i.average_score,
    reportMarkdown: i.report_markdown
  }
}

function fromSupabaseQA(q) {
  return {
    id: q.id, interviewId: q.interview_id,
    sequenceNumber: q.sequence_number, type: q.type,
    question: safeJSON(q.question, {}), userAnswer: q.user_answer,
    evaluation: safeJSON(q.evaluation, null), isFlagged: q.is_flagged,
    createdAt: q.created_at ? new Date(q.created_at) : null
  }
}

function fromSupabaseCompany(c) {
  const packedQuestions = safeJSON(c.questions, [])
  const meta = unpackCompanyMeta(packedQuestions)
  const columnSearchResults = safeJSON(c.search_results, [])
  return {
    id: c.id, companyName: c.company_name, position: c.position,
    jdContent: c.jd_content, source: c.source,
    jdParsed: safeJSON(c.jd_parsed, null) || meta.jdParsed,
    searchResults: columnSearchResults.length ? columnSearchResults : meta.searchResults,
    questions: meta.questions, tags: safeJSON(c.tags, []),
    createdAt: c.created_at ? new Date(c.created_at) : null,
    updatedAt: c.updated_at ? new Date(c.updated_at) : null
  }
}

function packCompanyQuestions(c) {
  const questions = Array.isArray(c.questions) ? c.questions.filter(q => q?.type !== 'company_meta') : []
  if (!c.jdParsed && !(c.searchResults || []).length) return questions
  return [
    {
      id: 'company_meta',
      type: 'company_meta',
      source: 'system',
      jdParsed: c.jdParsed || null,
      searchResults: c.searchResults || [],
      updatedAt: new Date().toISOString()
    },
    ...questions
  ]
}

function unpackCompanyMeta(questions) {
  const list = Array.isArray(questions) ? questions : []
  const meta = list.find(q => q?.type === 'company_meta') || {}
  return {
    jdParsed: meta.jdParsed || null,
    searchResults: meta.searchResults || [],
    questions: list.filter(q => q?.type !== 'company_meta')
  }
}

function safeJSON(val, fallback) {
  if (!val) return fallback
  if (typeof val === 'object') return val
  try { return JSON.parse(val) } catch { return fallback }
}
