import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

export const llmRouter = Router()

/**
 * 统一 LLM 聊天接口
 *
 * 请求头:
 *   x-provider-type: 'anthropic' | 'openai-compatible'
 *   x-api-key: 用户 API Key
 *   x-api-endpoint: OpenAI 兼容时的自定义端点 (可选)
 *   x-model: 模型名称
 *
 * 请求体:
 *   { system, messages, temperature?, max_tokens? }
 */
llmRouter.post('/chat', async (req, res) => {
  try {
    const providerType = req.headers['x-provider-type'] || 'anthropic'
    const apiKey = req.headers['x-api-key']
    const apiEndpoint = req.headers['x-api-endpoint']
    const model = req.headers['x-model'] || 'claude-sonnet-4-6'

    if (!apiKey) {
      return res.status(400).json({ error: '缺少 API Key (x-api-key 请求头)' })
    }

    const { system, messages, temperature = 0.3, max_tokens = 4096 } = req.body

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: '缺少 messages 数组' })
    }

    let content

    if (providerType === 'anthropic') {
      content = await callAnthropic(apiKey, model, system, messages, temperature, max_tokens)
    } else {
      content = await callOpenAICompatible(apiKey, apiEndpoint, model, system, messages, temperature, max_tokens)
    }

    res.json({ content })
  } catch (error) {
    console.error('LLM 调用失败:', error.message)
    res.status(500).json({
      error: 'LLM 调用失败',
      message: error.message,
      status: error.status
    })
  }
})

/**
 * 调用 Anthropic Messages API
 */
export async function callAnthropic(apiKey, model, system, messages, temperature, max_tokens, baseURL) {
  const config = { apiKey, timeout: 60000 }
  // 支持自定义端点（如 DeepSeek 的 Anthropic 兼容接口）
  if (baseURL) config.baseURL = baseURL.replace(/\/+$/, '')
  const anthropic = new Anthropic(config)

  // 转换消息格式: OpenAI 格式 -> Anthropic 格式
  const systemMessages = []
  const anthropicMessages = []

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemMessages.push(msg.content)
    } else if (msg.role === 'assistant') {
      anthropicMessages.push({ role: 'assistant', content: msg.content })
    } else if (msg.role === 'user') {
      anthropicMessages.push({ role: 'user', content: msg.content })
    }
  }

  // 如果有顶层 system，追加到系统消息
  const allSystem = [system, ...systemMessages].filter(Boolean).join('\n\n')

  console.log('🔄 Anthropic 调用:', { model, systemLen: allSystem.length, msgCount: anthropicMessages.length, max_tokens })

  const response = await anthropic.messages.create({
    model,
    system: allSystem || undefined,
    messages: anthropicMessages,
    temperature,
    max_tokens,
  })

  console.log('📦 Anthropic 返回:', {
    stopReason: response.stop_reason,
    contentCount: response.content?.length,
    type: response.content?.[0]?.type,
    textLen: response.content?.[0]?.text?.length
  })

  return response.content[0]?.text || ''
}

/**
 * 调用 OpenAI 兼容 API (DeepSeek, 通义千问, Ollama 等)
 */
export async function callOpenAICompatible(apiKey, apiEndpoint, model, system, messages, temperature, max_tokens) {
  const baseURL = apiEndpoint?.replace(/\/+$/, '') || 'https://api.openai.com/v1'

  const openai = new OpenAI({
    apiKey,
    baseURL: baseURL.endsWith('/v1') ? baseURL : `${baseURL}/v1`,
    timeout: 60000,
    maxRetries: 1
  })

  const formattedMessages = []

  // 添加顶层 system
  if (system) {
    formattedMessages.push({ role: 'system', content: system })
  }

  // 添加消息（保持 OpenAI 格式）
  for (const msg of messages) {
    formattedMessages.push(msg)
  }

  console.log('🔄 OpenAI兼容调用:', { model, baseURL, msgCount: formattedMessages.length, max_tokens })

  const response = await openai.chat.completions.create({
    model,
    messages: formattedMessages,
    temperature,
    max_tokens,
  })

  console.log('📦 OpenAI兼容返回:', {
    choiceCount: response.choices?.length,
    finishReason: response.choices?.[0]?.finish_reason,
    contentLen: response.choices?.[0]?.message?.content?.length
  })

  return response.choices[0]?.message?.content || ''
}

/**
 * 统一的 LLM 调用入口（供其他路由直接调用，避免 HTTP 自引用）
 */
export async function callLLM({ providerType, apiKey, apiEndpoint, model, system, messages, temperature = 0.3, max_tokens = 4096 }) {
  if (!apiKey) throw new Error('缺少 API Key')

  if (providerType === 'anthropic') {
    return await callAnthropic(apiKey, model, system, messages, temperature, max_tokens, apiEndpoint)
  } else {
    return await callOpenAICompatible(apiKey, apiEndpoint, model, system, messages, temperature, max_tokens)
  }
}

/**
 * 测试连接
 */
llmRouter.post('/test', async (req, res) => {
  try {
    const providerType = req.headers['x-provider-type'] || 'anthropic'
    const apiKey = req.headers['x-api-key']
    const apiEndpoint = req.headers['x-api-endpoint']
    const model = req.headers['x-model'] || 'claude-sonnet-4-6'

    if (!apiKey) {
      return res.status(400).json({ error: '缺少 API Key' })
    }

    // 发送简单测试消息
    const testMessages = [{ role: 'user', content: '请回复"连接成功"' }]

    let content
    if (providerType === 'anthropic') {
      content = await callAnthropic(apiKey, model, '你是一个测试助手。', testMessages, 0, 100, apiEndpoint)
    } else {
      content = await callOpenAICompatible(apiKey, apiEndpoint, model, '你是一个测试助手。', testMessages, 0, 100)
    }

    res.json({ success: true, content, model })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      status: error.status
    })
  }
})
