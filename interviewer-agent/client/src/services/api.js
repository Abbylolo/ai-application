/**
 * 后端 API 调用封装
 */

// 从 localStorage 获取当前模型配置
function getModelConfig() {
  try {
    const configId = localStorage.getItem('currentModelConfigId')
    const configs = JSON.parse(localStorage.getItem('modelConfigs') || '[]')
    return configs.find(c => c.id === configId) || configs[0] || {}
  } catch {
    return {}
  }
}

function getHeaders() {
  const config = getModelConfig()
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
 * LLM 聊天
 */
export async function chatLLM({ system, messages, temperature = 0.3, max_tokens = 4096 }) {
  const res = await fetch(`${BASE}/llm/chat`, {
    method: 'POST',
    headers: getHeaders(),
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
  const res = await fetch(`${BASE}/resume/parse`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ resumeText })
  })
  return res.json()
}

/**
 * 解析岗位描述
 */
export async function parseJD(jdText) {
  const res = await fetch(`${BASE}/jd/parse`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ jdText })
  })
  return res.json()
}

/**
 * 搜索公司面经
 */
export async function searchInterviewExperience(company, position = '前端开发') {
  const res = await fetch(`${BASE}/search/interview-experience?company=${encodeURIComponent(company)}&position=${encodeURIComponent(position)}`)
  return res.json()
}
