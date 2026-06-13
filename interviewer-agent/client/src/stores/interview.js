import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import db from '@/db/database.js'
import { chatLLM } from '@/services/api.js'

// 三种难度的面试官 System Prompt
const DIFFICULTY_PROMPTS = {
  small: `你是一位小厂（50-200人规模）的前端面试官。招聘风格是快速筛选，关注候选人是否能独立干活。
- 出题范围：JS 基础（变量类型、作用域、闭包基础）、CSS 布局（Flex/Grid）、Vue/React 常见使用问题
- 每道题后追问不超过1次
- 评分宽松，主要看基础是否扎实，态度是否端正
- 面试时长控制在15-20分钟，大约5-8道题
- 语气轻松友好，像聊天一样的面试节奏`,

  mid: `你是一位中厂（500-2000人规模）的前端面试官。注重项目经验和技术深度。
- 出题范围：JS 深入（闭包、原型链、异步、Event Loop）、框架原理（Vue 响应式/React Fiber）、工程化（Webpack/Vite/模块化）、性能优化
- 根据候选人的项目经验深挖细节
- 追问2-3次，考察思考深度和解决问题能力
- 面试时长30-40分钟，大约8-12道题
- 语气专业但不失亲和`,

  big: `你是一位大厂（字节/阿里/腾讯级别）的前端面试官。要求极高，考察全面深入。
- 出题范围：JS 底层原理（V8引擎、GC）、框架源码级理解（手写mini-vue/react）、系统设计（微前端架构、低代码平台设计）、算法（中等LeetCode）、网络协议（HTTP2/3、WebSocket深层）
- 追问机制：每个回答至少追问2次，不断深挖直到候选人答不上来，考察知识边界
- 包括至少一道系统设计题
- 评分严格，记录每个知识点的掌握程度
- 面试时长45-60分钟，大约10-15道题
- 语气冷静犀利，不给提示，像真实大厂高压面试`
}

// 结构化输出约束
const OUTPUT_FORMAT = `
你必须以严格的 JSON 格式回复（不要包含 markdown 代码块标记）：
{
  "phase": "question" | "followup" | "evaluation" | "summary",
  "content": "面试官要说的话",
  "question": {
    "id": "q序号",
    "category": "js_basics|react_vue|network|algorithm|engineering|system_design|css|performance",
    "difficulty": 1-5,
    "tags": ["关键词"],
    "referenceAnswer": "标准答案要点"
  },
  "evaluation": {
    "score": 1-5,
    "feedback": "点评",
    "strengths": ["优点"],
    "weaknesses": ["不足"],
    "followUpNeeded": true/false,
    "nextQuestion": "追问内容（如需追问）"
  }
}

注意：
- 出题时 phase="question"，evaluation 为 null
- 点评时 phase="evaluation"，question 为 null
- 生成报告时 phase="summary"
- 参考候选人的技术栈和项目经验来设计问题
`

export const useInterviewStore = defineStore('interview', () => {
  const interview = ref(null)
  const qaList = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const difficulty = ref('mid')
  const type = ref('general') // 'general' | 'company_specific'
  const companyName = ref('')
  const jdParsed = ref(null)

  const isStarted = computed(() => interview.value?.status === 'in_progress')
  const isCompleted = computed(() => interview.value?.status === 'completed')
  const questionCount = computed(() => qaList.value.filter(q => q.type === 'question').length)
  const averageScore = computed(() => {
    const scores = qaList.value
      .filter(q => q.evaluation?.score != null)
      .map(q => q.evaluation.score)
    if (!scores.length) return 0
    return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
  })

  // 构建系统消息
  function buildSystemPrompt(profile, jdInfo) {
    const diffPrompt = DIFFICULTY_PROMPTS[difficulty.value]

    let bg = '## 候选人背景\n'
    if (profile) {
      bg += `- 岗位：${profile.position || '未指定'}\n`
      bg += `- 工作年限：${profile.yearsOfExperience || 0}年\n`
      bg += `- 技术栈：${profile.techStack?.map(t => t.name).join('、') || '未指定'}\n`
      if (profile.projects?.length) {
        bg += `- 项目经验：${profile.projects.map(p => `${p.name}（${p.techUsed?.join('/')}）`).join('；')}\n`
      }
      if (profile.education?.school) {
        bg += `- 学历：${profile.education.degree} - ${profile.education.major} - ${profile.education.school}\n`
      }
      if (profile.strengths?.length) {
        bg += `- 优势：${profile.strengths.join('、')}\n`
      }
      if (profile.weaknesses?.length) {
        bg += `- 待提升：${profile.weaknesses.join('、')}\n`
      }
    }

    if (jdInfo && type.value === 'company_specific') {
      bg += `\n## 目标岗位要求\n`
      bg += `- 公司：${companyName.value}\n`
      bg += `- 岗位：${jdInfo.position || ''}\n`
      bg += `- 级别：${jdInfo.level || ''}\n`
      bg += `- 必备技能：${jdInfo.requiredSkills?.join('、') || ''}\n`
      if (jdInfo.niceToHave?.length) bg += `- 加分项：${jdInfo.niceToHave.join('、')}\n`
      bg += `- 职责：${jdInfo.responsibilities?.join('；') || ''}\n`
      bg += `\n请根据目标岗位要求设计面试题目，确保与岗位职责高度相关。`
    }

    return diffPrompt + '\n\n' + bg + '\n\n' + OUTPUT_FORMAT
  }

  // 开始面试
  async function startInterview(profile, config = {}) {
    isLoading.value = true
    error.value = null

    try {
      difficulty.value = config.difficulty || 'mid'
      type.value = config.type || 'general'
      companyName.value = config.companyName || ''

      // 创建面试记录
      interview.value = {
        id: Date.now().toString(),
        profileId: profile?.id,
        type: type.value,
        companyName: companyName.value,
        difficulty: difficulty.value,
        reviewMode: config.reviewMode || 'instant',
        status: 'in_progress',
        startedAt: new Date(),
        totalQuestions: 0,
        averageScore: null,
        reportMarkdown: null
      }

      // 获取第一道题
      const system = buildSystemPrompt(profile, config.jdInfo)
      const messages = [
        { role: 'user', content: '面试开始，请出第一道题。介绍你自己并开始提问。' }
      ]

      const result = await chatLLM({ system, messages, temperature: 0.7 })
      const parsed = parseResponse(result)

      // 保存面试记录
      await db.interviews.add(interview.value)

      // 添加面试官的第一条消息
      const firstQA = {
        interviewId: interview.value.id,
        sequenceNumber: 1,
        type: 'question',
        question: parsed.question || { text: parsed.content || result.content, category: 'general', difficulty: 1, tags: [], referenceAnswer: '' },
        userAnswer: '',
        evaluation: null,
        isFlagged: false,
        createdAt: new Date()
      }
      await db.interviewQA.add(firstQA)
      qaList.value = [firstQA]

      return parsed
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 提交回答
  async function submitAnswer(answer, profile) {
    if (!interview.value) return

    isLoading.value = true
    error.value = null

    try {
      // 更新当前 QA 的回答
      const currentQA = qaList.value[qaList.value.length - 1]
      if (currentQA && !currentQA.userAnswer) {
        currentQA.userAnswer = answer
        await db.interviewQA.update(currentQA.id, { userAnswer: answer })
      }

      // 构建对话历史
      const system = buildSystemPrompt(profile, jdParsed.value)
      const messages = buildMessageHistory()

      // 添加评估请求（根据评审模式调整 prompt）
      const reviewMode = interview.value?.reviewMode || 'instant'
      const isSummary = reviewMode === 'summary'
      const evalInstruction = isSummary
        ? `请内部评估回答质量（评分1-5），但**不要展示评分给候选人**。直接决定追问还是出下一题，像正常面试一样自然过渡。仍需在JSON中保留evaluation数据用于最终报告。`
        : `请评估我的回答，给出评分（1-5分）、点评、优缺点。${currentQA.type === 'question' ? '如果回答不够深入，请继续追问。如果回答基本到位，请出下一道题。' : '追问之后，请评估并决定是否继续追问或出下一题。'}`

      messages.push({
        role: 'user',
        content: `我的回答是：${answer}\n\n${evalInstruction}`
      })

      const result = await chatLLM({ system, messages, temperature: 0.5 })

      let parsed
      try {
        parsed = JSON.parse(extractJSON(result.content))
      } catch {
        // 解析失败，当作纯文本
        parsed = { phase: 'evaluation', content: result.content, evaluation: { score: 3, feedback: result.content, strengths: [], weaknesses: [], followUpNeeded: false, nextQuestion: '' } }
      }

      // 保存评估到当前 QA
      if (parsed.evaluation) {
        currentQA.evaluation = parsed.evaluation
        await db.interviewQA.update(currentQA.id, { evaluation: parsed.evaluation })
      }

      // 创建下一个 QA
      const nextQA = {
        interviewId: interview.value.id,
        sequenceNumber: qaList.value.length + 1,
        type: parsed.evaluation?.followUpNeeded ? 'followup' : 'question',
        question: parsed.question || { text: parsed.content, category: 'general', difficulty: 1, tags: [], referenceAnswer: '' },
        userAnswer: '',
        evaluation: null,
        isFlagged: false,
        createdAt: new Date()
      }

      await db.interviewQA.add(nextQA)
      qaList.value.push(nextQA)

      // 更新面试记录
      interview.value.totalQuestions = questionCount.value

      return parsed
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 结束面试并生成报告
  async function finishInterview(profile) {
    if (!interview.value) return

    isLoading.value = true
    error.value = null

    try {
      const system = buildSystemPrompt(profile, jdParsed.value)

      // 构建完整的对话历史用于生成总结
      const messages = buildMessageHistory()
      messages.push({
        role: 'user',
        content: `面试结束。请生成一份完整的面试评估报告。

返回 JSON:
{
  "phase": "summary",
  "content": "## 面试总结\\n\\n（对候选人整体表现的评价，300字左右）",
  "summary": {
    "totalScore": ${averageScore.value},
    "scores": {
      "jsBasics": 1-5,
      "framework": 1-5,
      "network": 1-5,
      "algorithm": 1-5,
      "engineering": 1-5,
      "systemDesign": 1-5
    },
    "overall": "总体评价文字",
    "strengths": ["优点列表"],
    "weaknesses": ["需要加强的领域"],
    "learningPlan": ["学习建议1", "学习建议2"]
  }
}`
      })

      const result = await chatLLM({ system, messages, temperature: 0.3 })

      let parsed
      try {
        parsed = JSON.parse(extractJSON(result.content))
      } catch {
        parsed = { phase: 'summary', content: result.content, summary: { totalScore: averageScore.value, overall: result.content, strengths: [], weaknesses: [], learningPlan: [] } }
      }

      // 生成 Markdown 报告
      const report = generateMarkdownReport(parsed)

      // 更新面试记录
      interview.value.status = 'completed'
      interview.value.completedAt = new Date()
      interview.value.averageScore = averageScore.value
      interview.value.reportMarkdown = report

      await db.interviews.update(interview.value.id, {
        status: 'completed',
        completedAt: interview.value.completedAt,
        averageScore: interview.value.averageScore,
        reportMarkdown: report
      })

      return { parsed, report }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 构建对话历史
  function buildMessageHistory() {
    const messages = [{ role: 'user', content: '面试开始，请出第一道题。介绍你自己并开始提问。' }]

    for (const qa of qaList.value) {
      if (qa.question?.text || qa.question?.referenceAnswer) {
        messages.push({
          role: 'assistant',
          content: JSON.stringify({ phase: 'question', content: qa.question.text || '', question: qa.question })
        })
      }
      if (qa.userAnswer) {
        messages.push({ role: 'user', content: qa.userAnswer })
        if (qa.evaluation) {
          messages.push({
            role: 'assistant',
            content: JSON.stringify({ phase: 'evaluation', evaluation: qa.evaluation, content: qa.evaluation.feedback || '' })
          })
        }
      }
    }

    return messages
  }

  // 生成 Markdown 报告
  function generateMarkdownReport(summaryData) {
    const i = interview.value
    const s = summaryData.summary || {}

    let md = `# 面试评估报告\n\n`
    md += `---\n\n`
    md += `## 基本信息\n\n`
    md += `| 项目 | 内容 |\n`
    md += `|------|------|\n`
    md += `| 面试时间 | ${i.startedAt?.toLocaleString() || '-'} |\n`
    md += `| 面试时长 | ${i.completedAt ? Math.round((i.completedAt - i.startedAt) / 60000) + '分钟' : '-'} |\n`
    md += `| 难度等级 | ${i.difficulty === 'small' ? '小厂' : i.difficulty === 'mid' ? '中厂' : '大厂'} |\n`
    md += `| 面试类型 | ${i.type === 'company_specific' ? '公司特定面试' : '通用面试'} |\n`
    if (i.companyName) md += `| 目标公司 | ${i.companyName} |\n`
    md += `| 题目数量 | ${i.totalQuestions || 0} |\n`
    md += `| 平均得分 | ${i.averageScore || '-'} / 5 |\n\n`

    md += `## 总体评价\n\n${s.overall || '无'}\n\n`

    if (s.scores) {
      md += `## 各维度评分\n\n`
      md += `| 维度 | 评分 |\n`
      md += `|------|------|\n`
      for (const [key, value] of Object.entries(s.scores)) {
        const labels = { jsBasics: 'JS基础', framework: '框架', network: '网络', algorithm: '算法', engineering: '工程化', systemDesign: '系统设计' }
        md += `| ${labels[key] || key} | ${'⭐'.repeat(value || 0)} (${value}/5) |\n`
      }
      md += `\n`
    }

    if (s.strengths?.length) {
      md += `## 表现亮点\n\n`
      for (const item of s.strengths) md += `- ✅ ${item}\n`
      md += `\n`
    }

    if (s.weaknesses?.length) {
      md += `## 需要加强\n\n`
      for (const item of s.weaknesses) md += `- ❌ ${item}\n`
      md += `\n`
    }

    md += `## 问答记录\n\n`
    for (const qa of qaList.value.filter(q => q.userAnswer)) {
      md += `### Q${qa.sequenceNumber}: ${qa.question?.text || qa.question?.referenceAnswer || ''}\n\n`
      md += `**你的回答：** ${qa.userAnswer}\n\n`
      if (qa.evaluation) {
        md += `**评分：** ${'⭐'.repeat(qa.evaluation.score || 0)} (${qa.evaluation.score}/5)\n\n`
        md += `**点评：** ${qa.evaluation.feedback || ''}\n\n`
        if (qa.question?.referenceAnswer) {
          md += `**参考要点：** ${qa.question.referenceAnswer}\n\n`
        }
      }
      md += `---\n\n`
    }

    if (s.learningPlan?.length) {
      md += `## 学习建议\n\n`
      for (let i = 0; i < s.learningPlan.length; i++) {
        md += `${i + 1}. ${s.learningPlan[i]}\n`
      }
      md += `\n`
    }

    md += `---\n\n`
    md += `> 本报告由 面试官 Agent 自动生成 | ${new Date().toLocaleString()}\n`

    return md
  }

  // 解析 LLM 响应
  function parseResponse(result) {
    if (!result?.content) return { phase: 'question', content: '面试开始' }

    let content = result.content.trim()

    // 提取 markdown 代码块中的 JSON
    const codeBlockMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)```/)
    if (codeBlockMatch) {
      content = codeBlockMatch[1].trim()
    }

    // 尝试提取 JSON 对象
    if (!content.startsWith('{')) {
      const jsonStart = content.indexOf('{')
      const jsonEnd = content.lastIndexOf('}')
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        content = content.slice(jsonStart, jsonEnd + 1)
      }
    }

    try {
      return JSON.parse(content)
    } catch {
      return { phase: 'question', content: result.content }
    }
  }

  // 解析 LLM 响应中的 JSON（通用工具函数，处理各种格式）
  function extractJSON(text) {
    let cleaned = (text || '').trim()
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)```/)
    if (codeBlockMatch) cleaned = codeBlockMatch[1].trim()
    if (!cleaned.startsWith('{')) {
      const start = cleaned.indexOf('{'), end = cleaned.lastIndexOf('}')
      if (start !== -1 && end > start) cleaned = cleaned.slice(start, end + 1)
    }
    return cleaned
  }

  // 加载已有面试
  async function loadInterview(id) {
    isLoading.value = true
    try {
      interview.value = await db.interviews.get(parseInt(id))
      if (interview.value) {
        qaList.value = await db.interviewQA
          .where('interviewId')
          .equals(interview.value.id)
          .sortBy('sequenceNumber')
        difficulty.value = interview.value.difficulty
        type.value = interview.value.type
        companyName.value = interview.value.companyName || ''
      }
    } finally {
      isLoading.value = false
    }
  }

  // 重置
  function reset() {
    interview.value = null
    qaList.value = []
    difficulty.value = 'mid'
    type.value = 'general'
    companyName.value = ''
    jdParsed.value = null
  }

  return {
    interview,
    qaList,
    isLoading,
    error,
    difficulty,
    type,
    companyName,
    jdParsed,
    isStarted,
    isCompleted,
    questionCount,
    averageScore,
    startInterview,
    submitAnswer,
    finishInterview,
    loadInterview,
    reset,
    buildSystemPrompt
  }
})
