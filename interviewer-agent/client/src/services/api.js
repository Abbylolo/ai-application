/**
 * 后端 API 调用封装
 */
import * as data from '@/services/data.js'

// 从 Supabase 直接获取当前模型配置
async function getModelConfig() {
  try {
    const configId = localStorage.getItem('currentModelConfigId')
    const allConfigs = await data.getModelConfigs()
    return allConfigs.find(c => String(c.id) === String(configId)) || allConfigs[0] || {}
  } catch {
    return {}
  }
}

async function getHeaders() {
  const config = await getModelConfig()
  return {
    'Content-Type': 'application/json',
    'x-provider-type': config.providerType || 'anthropic',
    'x-api-key': config.apiKey || '',
    'x-api-endpoint': config.endpoint || '',
    'x-model': config.modelName || 'claude-sonnet-4-6'
  }
}

const BASE = '/api'

/**
 * LLM 聊天（带超时）
 */
async function fetchWithTimeout(url, options, timeout = 120000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    return res
  } finally {
    clearTimeout(timer)
  }
}

export async function chatLLM({ system, messages, temperature = 0.3, max_tokens = 4096 }) {
  const headers = await getHeaders()
  const res = await fetchWithTimeout(`${BASE}/llm/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ system, messages, temperature, max_tokens })
  })
  return res.json()
}

/**
 * 测试模型连接
 */
export async function testConnection(config) {
  const headers = {
    'Content-Type': 'application/json',
    'x-provider-type': config.providerType || 'anthropic',
    'x-api-key': config.apiKey || '',
    'x-api-endpoint': config.endpoint || '',
    'x-model': config.modelName || 'claude-sonnet-4-6'
  }
  const res = await fetch(`${BASE}/llm/test`, {
    method: 'POST',
    headers
  })
  return res.json()
}

/**
 * 解析简历
 */
export async function parseResume(resumeText) {
  const headers = await getHeaders()
  const res = await fetchWithTimeout(`${BASE}/resume/parse`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ resumeText })
  }, 120000)
  return res.json()
}

/**
 * 解析岗位描述
 */
export async function parseJD(jdText) {
  const headers = await getHeaders()
  const res = await fetchWithTimeout(`${BASE}/jd/parse`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jdText })
  }, 120000)
  return res.json()
}

/**
 * 搜索公司面经
 */
export async function searchInterviewExperience(company, position = '前端开发') {
  const res = await fetch(`${BASE}/search/interview-experience?company=${encodeURIComponent(company)}&position=${encodeURIComponent(position)}`)
  return res.json()
}
