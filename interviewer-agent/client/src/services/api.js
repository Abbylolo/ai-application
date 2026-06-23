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
  const apiKey = (config.apiKey || '').trim()
  const providerType = config.providerType || 'anthropic'
  if (!apiKey) {
    throw new Error('请先在设置中配置可用的模型 API Key')
  }
  if (looksEncryptedValue(apiKey)) {
    throw new Error('模型 API Key 解密失败，请检查线上 VITE_ENCRYPTION_KEY，或在设置页重新保存模型配置')
  }
  validateProviderKey(providerType, apiKey)
  return {
    'Content-Type': 'application/json',
    'x-provider-type': providerType,
    'x-api-key': apiKey,
    'x-api-endpoint': config.endpoint || '',
    'x-model': config.modelName || 'claude-sonnet-4-6'
  }
}

function looksEncryptedValue(value) {
  if (!value || /^sk-|^ak-|^pk-/.test(value)) return false
  return value.length > 60 && /^[A-Za-z0-9+/=]+$/.test(value)
}

function validateProviderKey(providerType, apiKey) {
  if (providerType === 'anthropic' && !apiKey.startsWith('sk-ant-')) {
    throw new Error('当前模型配置选择的是 Anthropic，但 API Key 不是 sk-ant- 开头。请在设置页切换正确供应商，或重新填写 Anthropic API Key')
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
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.error) {
    throw new Error(data.message || data.error || `LLM 请求失败 (${res.status})`)
  }
  return data
}

/**
 * 测试模型连接
 */
export async function testConnection(config) {
  const apiKey = (config.apiKey || '').trim()
  const headers = {
    'Content-Type': 'application/json',
    'x-provider-type': config.providerType || 'anthropic',
    'x-api-key': apiKey,
    'x-api-endpoint': config.endpoint || '',
    'x-model': config.modelName || 'claude-sonnet-4-6'
  }
  const res = await fetch(`${BASE}/llm/test`, {
    method: 'POST',
    headers
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.error || data.success === false) {
    return {
      success: false,
      error: formatLLMError(data.message || data.error || `请求失败 (${res.status})`)
    }
  }
  return data
}

function formatLLMError(message) {
  if (typeof message === 'string' && message.includes('invalid x-api-key')) {
    return 'API Key 无效：请检查模型供应商是否选对，并重新粘贴正确的 Key'
  }
  return message
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
