import { Router } from 'express'
import { callLLM } from './llm.js'

export const jdRouter = Router()

/**
 * JD（岗位描述）解析接口
 */
jdRouter.post('/parse', async (req, res) => {
  try {
    const { jdText } = req.body

    if (!jdText) {
      return res.status(400).json({ error: '缺少岗位描述文本' })
    }

    const providerType = req.headers['x-provider-type'] || 'anthropic'
    const apiKey = req.headers['x-api-key']
    const apiEndpoint = req.headers['x-api-endpoint'] || ''
    const model = req.headers['x-model'] || 'claude-sonnet-4-6'

    if (!apiKey) {
      return res.status(400).json({ error: '缺少 API Key，请先在设置中配置模型' })
    }

    const systemPrompt = `你是一个专业的岗位描述解析器。从JD文本中提取关键信息，严格返回如下JSON格式（不要输出其他内容）：
{
  "position": "岗位名称",
  "level": "初级|中级|高级|专家",
  "responsibilities": ["职责1", "职责2"],
  "requiredSkills": ["必备技能1", "必备技能2"],
  "niceToHave": ["加分项1"],
  "teamBusiness": "业务方向简述",
  "keywords": ["关键词1", "关键词2"]
}`

    const messages = [
      { role: 'user', content: `请解析以下岗位描述：\n\n${jdText}` }
    ]

    const content = await callLLM({
      providerType, apiKey, apiEndpoint, model,
      system: systemPrompt,
      messages,
      temperature: 0.1,
      max_tokens: 4096
    })

    let cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    try {
      res.json(JSON.parse(cleaned))
    } catch {
      res.json({ rawContent: content, parseError: '无法解析为JSON' })
    }
  } catch (error) {
    console.error('JD解析失败:', error.message)
    res.status(500).json({ error: 'JD解析失败', message: error.message })
  }
})
