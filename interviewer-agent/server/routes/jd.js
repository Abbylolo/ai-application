import { Router } from 'express'

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

    const response = await fetch(`http://localhost:${process.env.PORT || 5200}/api/llm/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-provider-type': req.headers['x-provider-type'] || 'anthropic',
        'x-api-key': req.headers['x-api-key'],
        'x-api-endpoint': req.headers['x-api-endpoint'] || '',
        'x-model': req.headers['x-model'] || 'claude-sonnet-4-6'
      },
      body: JSON.stringify({ system: systemPrompt, messages, temperature: 0.1, max_tokens: 4096 })
    })

    const result = await response.json()
    if (result.error) return res.status(500).json(result)

    let content = result.content || ''
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    try {
      res.json(JSON.parse(content))
    } catch {
      res.json({ rawContent: result.content, parseError: '无法解析为JSON' })
    }
  } catch (error) {
    console.error('JD解析失败:', error.message)
    res.status(500).json({ error: 'JD解析失败', message: error.message })
  }
})
