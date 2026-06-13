import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { llmRouter } from './routes/llm.js'
import { resumeRouter } from './routes/resume.js'
import { jdRouter } from './routes/jd.js'
import { searchRouter } from './routes/search.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5200

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// LLM 代理路由（支持多协议）
app.use('/api/llm', llmRouter)

// 简历解析路由
app.use('/api/resume', resumeRouter)

// JD 解析路由
app.use('/api/jd', jdRouter)

// 数据库操作路由
import { dbRouter } from './routes/db.js'
app.use('/api/db', dbRouter)

// 网络搜索路由
app.use('/api/search', searchRouter)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 全局错误处理：确保任何未捕获错误都返回 JSON
app.use((err, req, res, next) => {
  console.error('服务器错误:', err.message)
  res.status(500).json({ error: '服务器内部错误', message: err.message })
})

app.listen(PORT, () => {
  console.log(`🤖 面试官 Agent 后端代理已启动: http://localhost:${PORT}`)
})
