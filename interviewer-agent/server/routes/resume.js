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

    if (!apiKey) {
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

    const content = await callLLM({
      providerType, apiKey, apiEndpoint, model,
      system: systemPrompt,
      messages,
      temperature: 0.1,
      max_tokens: 4096
    })

    // 尝试解析 JSON（剥离可能的 markdown 代码块）
    let cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    try {
      const parsed = JSON.parse(cleaned)
      res.json(parsed)
    } catch {
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
