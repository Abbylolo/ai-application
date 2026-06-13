import { Router } from 'express'
import { callLLM } from './llm.js'

export const resumeRouter = Router()

/**
 * 简历解析接口
 * 接收简历文本，直接调用 LLM 提取结构化信息
 */
resumeRouter.post('/parse', async (req, res) => {
  try {
    const { resumeText } = req.body

    if (!resumeText) {
      return res.status(400).json({ error: '缺少简历文本' })
    }

    const providerType = req.headers['x-provider-type'] || 'anthropic'
    const apiKey = req.headers['x-api-key']
    const apiEndpoint = req.headers['x-api-endpoint'] || ''
    const model = req.headers['x-model'] || 'claude-sonnet-4-6'

    console.log('📄 简历解析请求:', { providerType, model, apiKey: apiKey ? '***已设置***' : '❌未设置', textLength: resumeText.length })

    if (!apiKey) {
      console.log('❌ 缺少 API Key')
      return res.status(400).json({ error: '缺少 API Key，请先在设置中配置模型' })
    }

    const systemPrompt = `你是一个专业的简历解析器。从简历文本中提取信息，严格返回如下JSON格式（不要输出其他内容）：
{
  "name": "姓名",
  "position": "目标岗位",
  "yearsOfExperience": 工作年限数字,
  "techStack": [
    { "name": "技术名", "level": "proficient|familiar|learning", "category": "language|framework|tool|platform" }
  ],
  "projects": [
    { "name": "项目名", "description": "简述", "techUsed": ["技术1", "技术2"], "duration": "时间段" }
  ],
  "education": { "degree": "学位", "major": "专业", "school": "学校" },
  "strengths": ["优势领域"],
  "weaknesses": ["可提升领域"]
}`

    const messages = [
      { role: 'user', content: `请解析以下简历：\n\n${resumeText}` }
    ]

    console.log('🔄 调用 LLM 解析简历...')
    const content = await callLLM({
      providerType, apiKey, apiEndpoint, model,
      system: systemPrompt,
      messages,
      temperature: 0.1,
      max_tokens: 4096
    })
    console.log('✅ LLM 返回内容长度:', content?.length)

    // 尝试解析 JSON（处理各种 LLM 返回格式）
    let cleaned = content.trim()

    // 1. 提取 markdown 代码块中的内容
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)```/)
    if (codeBlockMatch) {
      cleaned = codeBlockMatch[1].trim()
    }

    // 2. 如果还有多余内容，尝试提取 JSON 对象
    if (!cleaned.startsWith('{')) {
      const jsonStart = cleaned.indexOf('{')
      const jsonEnd = cleaned.lastIndexOf('}')
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        cleaned = cleaned.slice(jsonStart, jsonEnd + 1)
      }
    }

    try {
      const parsed = JSON.parse(cleaned)
      res.json(parsed)
    } catch (e) {
      console.log('JSON解析失败，原始内容前200字:', content.substring(0, 200))
      res.json({
        rawContent: content,
        parseError: '无法解析为 JSON，请检查简历文本格式。提示：确保文本包含足够的工作经历和技术信息。'
      })
    }
  } catch (error) {
    console.error('简历解析失败:', error.message)
    res.status(500).json({ error: '简历解析失败', message: error.message })
  }
})
