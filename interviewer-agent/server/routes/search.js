import { Router } from 'express'

export const searchRouter = Router()

/**
 * 网络搜索面经接口
 * 使用 DuckDuckGo HTML 搜索（无 API Key 需要）
 */
searchRouter.get('/interview-experience', async (req, res) => {
  try {
    const { company, position = '前端开发' } = req.query

    if (!company) {
      return res.status(400).json({ error: '缺少公司名称参数' })
    }

    const query = `${company} ${position} 面试经验 面经`
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    })

    const html = await response.text()

    // 简单提取搜索结果摘要
    const snippets = []
    const snippetRegex = /class="result__snippet"[^>]*>(.*?)<\/a>/gs
    let match

    while ((match = snippetRegex.exec(html)) !== null) {
      const text = match[1].replace(/<[^>]+>/g, '').trim()
      if (text) snippets.push(text)
    }

    // 也提取链接
    const links = []
    const linkRegex = /class="result__url"[^>]*>(.*?)<\/a>/gs
    while ((match = linkRegex.exec(html)) !== null) {
      const text = match[1].replace(/<[^>]+>/g, '').trim()
      if (text) links.push(text)
    }

    res.json({
      query,
      results: snippets.slice(0, 10).map((snippet, i) => ({
        snippet,
        url: links[i] || ''
      })),
      totalCount: snippets.length
    })
  } catch (error) {
    console.error('搜索失败:', error.message)
    res.status(500).json({ error: '搜索失败', message: error.message })
  }
})
