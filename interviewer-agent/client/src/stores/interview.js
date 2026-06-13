import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as data from '@/services/data.js'
import { chatLLM } from '@/services/api.js'

// ... (DIFFICULTY_PROMPTS, OUTPUT_FORMAT 保持不动)
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
注意：出题时 phase="question"，evaluation 为 null；点评时 phase="evaluation"，question 为 null；生成报告时 phase="summary"`

export const useInterviewStore = defineStore('interview', () => {
  const interview = ref(null)
  const qaList = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const difficulty = ref('mid')
  const type = ref('general')
  const companyName = ref('')
  const jdParsed = ref(null)

  const isStarted = computed(() => interview.value?.status === 'in_progress')
  const isCompleted = computed(() => interview.value?.status === 'completed')
  const questionCount = computed(() => qaList.value.filter(q => q.type === 'question').length)
  const averageScore = computed(() => {
    const scores = qaList.value.filter(q => q.evaluation?.score != null).map(q => q.evaluation.score)
    if (!scores.length) return 0
    return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
  })

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
    }
    if (jdInfo && type.value === 'company_specific') {
      bg += `\n## 目标岗位要求\n- 公司：${companyName.value}\n`
      bg += `- 必备技能：${jdInfo.requiredSkills?.join('、') || ''}\n`
    }
    return diffPrompt + '\n\n' + bg + '\n\n' + OUTPUT_FORMAT
  }

  async function startInterview(profile, config = {}) {
    isLoading.value = true; error.value = null
    try {
      difficulty.value = config.difficulty || 'mid'
      type.value = config.type || 'general'
      companyName.value = config.companyName || ''

      interview.value = {
        profileId: profile?.id, type: type.value, companyName: companyName.value,
        difficulty: difficulty.value, reviewMode: config.reviewMode || 'instant',
        status: 'in_progress', startedAt: new Date().toISOString(),
        totalQuestions: 0, averageScore: null, reportMarkdown: null
      }
      // 存 Supabase 拿 id
      interview.value = await data.saveInterview(interview.value)

      const system = buildSystemPrompt(profile, config.jdInfo)
      const messages = [{ role: 'user', content: '面试开始，请出第一道题。介绍你自己并开始提问。' }]
      const result = await chatLLM({ system, messages, temperature: 0.7, max_tokens: 8192 })
      const parsed = parseResponse(result)

      const q = parsed.question || {}
      const firstQA = {
        interviewId: interview.value.id, sequenceNumber: 1, type: 'question',
        question: {
          id: q.id || 'q1',
          text: parsed.content || q.text || '',
          category: q.category || 'general',
          difficulty: q.difficulty || 1,
          tags: q.tags || [],
          referenceAnswer: q.referenceAnswer || ''
        },
        userAnswer: '', evaluation: null, isFlagged: false
      }
      console.log('🔍 firstQA before save:', JSON.stringify(firstQA.question).slice(0, 200))
      const savedQA = await data.saveQA(firstQA)
      qaList.value = [savedQA]
      return parsed
    } catch (err) {
      error.value = err.message; throw err
    } finally { isLoading.value = false }
  }

  async function submitAnswer(answer, profile) {
    if (!interview.value) return
    isLoading.value = true; error.value = null
    try {
      const currentQA = qaList.value[qaList.value.length - 1]
      if (currentQA && !currentQA.userAnswer) {
        currentQA.userAnswer = answer
        await data.updateQA(currentQA.id, { userAnswer: answer })
      }

      const system = buildSystemPrompt(profile, jdParsed.value)
      const messages = buildMessageHistory()
      const reviewMode = interview.value?.reviewMode || 'instant'
      const isSummary = reviewMode === 'summary'
      const evalInstruction = isSummary
        ? `请内部评估回答质量（评分1-5），但不要展示评分给候选人。直接决定追问还是出下一题。仍需在JSON中保留evaluation数据。`
        : `请评估我的回答，给出评分（1-5分）、点评、优缺点。${currentQA.type === 'question' ? '如不够深入请继续追问，到位就出下一题。' : '评估并决定是否继续追问或出下一题。'}`
      messages.push({ role: 'user', content: `${answer}\n\n${evalInstruction}` })

      const result = await chatLLM({ system, messages, temperature: 0.5, max_tokens: 8192 })
      let parsed
      try { parsed = JSON.parse(extractJSON(result.content)) }
      catch { parsed = { phase: 'evaluation', content: result.content, evaluation: { score: 3, feedback: result.content, strengths: [], weaknesses: [], followUpNeeded: false } } }

      if (parsed.evaluation) {
        currentQA.evaluation = parsed.evaluation
        await data.updateQA(currentQA.id, { evaluation: parsed.evaluation })
      }

      const nq = parsed.question || {}
      const nextQA = {
        interviewId: interview.value.id, sequenceNumber: qaList.value.length + 1,
        type: parsed.evaluation?.followUpNeeded ? 'followup' : 'question',
        question: {
          id: nq.id || ('q' + (qaList.value.length + 1)),
          text: parsed.content || nq.text || '',
          category: nq.category || 'general',
          difficulty: nq.difficulty || 1,
          tags: nq.tags || [],
          referenceAnswer: nq.referenceAnswer || ''
        },
        userAnswer: '', evaluation: null, isFlagged: false
      }
      const savedQA = await data.saveQA(nextQA)
      qaList.value.push(savedQA)

      interview.value.totalQuestions = questionCount.value
    } catch (err) {
      error.value = err.message; throw err
    } finally { isLoading.value = false }
  }

  async function finishInterview(profile) {
    if (!interview.value) return
    isLoading.value = true; error.value = null
    try {
      const system = buildSystemPrompt(profile, jdParsed.value)
      const messages = buildMessageHistory()
      messages.push({ role: 'user', content: `面试结束。请生成完整评估报告, 返回JSON: {"phase":"summary","content":"总结","summary":{"totalScore":${averageScore.value},"overall":"","strengths":[],"weaknesses":[],"learningPlan":[]}}` })

      const result = await chatLLM({ system, messages, temperature: 0.3, max_tokens: 8192 })
      let parsed
      try { parsed = JSON.parse(extractJSON(result.content)) }
      catch { parsed = { phase: 'summary', summary: { totalScore: averageScore.value, overall: result.content, strengths: [], weaknesses: [], learningPlan: [] } } }

      const report = generateMarkdownReport(parsed)
      await data.saveInterview({
        ...interview.value,
        status: 'completed', completedAt: new Date().toISOString(),
        averageScore: averageScore.value, reportMarkdown: report
      })
      interview.value.status = 'completed'
      interview.value.reportMarkdown = report
      return { parsed, report }
    } catch (err) {
      error.value = err.message; throw err
    } finally { isLoading.value = false }
  }

  // ========== 辅助函数 ==========

  function buildMessageHistory() {
    const msgs = [{ role: 'user', content: '面试开始，请出第一道题。' }]
    for (const qa of qaList.value) {
      if (qa.question?.text) msgs.push({ role: 'assistant', content: JSON.stringify({ phase: 'question', content: qa.question.text, question: qa.question }) })
      if (qa.userAnswer) {
        msgs.push({ role: 'user', content: qa.userAnswer })
        if (qa.evaluation) msgs.push({ role: 'assistant', content: JSON.stringify({ phase: 'evaluation', evaluation: qa.evaluation }) })
      }
    }
    return msgs
  }

  function generateMarkdownReport(summaryData) {
    const i = interview.value; const s = summaryData.summary || {}
    let md = `# 面试评估报告\n\n`
    md += `| 项目 | 内容 |\n|------|------|\n`
    md += `| 难度 | ${i.difficulty === 'small' ? '小厂' : i.difficulty === 'mid' ? '中厂' : '大厂'} |\n`
    if (i.companyName) md += `| 公司 | ${i.companyName} |\n`
    md += `| 平均得分 | ${i.averageScore || '-'} / 5 |\n\n`
    md += `## 总体评价\n\n${s.overall || '无'}\n\n`
    if (s.strengths?.length) { md += `## 亮点\n`; s.strengths.forEach(x => md += `- ✅ ${x}\n`); md += '\n' }
    if (s.weaknesses?.length) { md += `## 需加强\n`; s.weaknesses.forEach(x => md += `- ❌ ${x}\n`); md += '\n' }
    md += `## 问答记录\n\n`
    for (const qa of qaList.value.filter(q => q.userAnswer)) {
      md += `**Q${qa.sequenceNumber}:** ${qa.question?.text || ''}\n\n> ${qa.userAnswer}\n\n`
      if (qa.evaluation) md += `评分: ${'⭐'.repeat(qa.evaluation.score||0)} | ${qa.evaluation.feedback || ''}\n\n`
      md += `---\n\n`
    }
    if (s.learningPlan?.length) { md += `## 学习建议\n`; s.learningPlan.forEach((x, i) => md += `${i+1}. ${x}\n`) }
    return md
  }

  function parseResponse(result) {
    if (!result?.content) return { phase: 'question', content: '面试开始' }
    try { return JSON.parse(extractJSON(result.content)) }
    catch { return { phase: 'question', content: result.content } }
  }

  function extractJSON(text) {
    let cleaned = (text || '').trim()
    const m = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)```/)
    if (m) cleaned = m[1].trim()
    if (!cleaned.startsWith('{')) { const s = cleaned.indexOf('{'), e = cleaned.lastIndexOf('}'); if (s !== -1 && e > s) cleaned = cleaned.slice(s, e + 1) }
    return cleaned
  }

  async function loadInterview(id) {
    isLoading.value = true
    try {
      const interviews = await data.getInterviews()
      interview.value = interviews.find(i => String(i.id) === String(id))
      if (interview.value) {
        qaList.value = await data.getQA(interview.value.id)
        difficulty.value = interview.value.difficulty
        type.value = interview.value.type
        companyName.value = interview.value.companyName || ''
      }
    } finally { isLoading.value = false }
  }

  function reset() {
    interview.value = null; qaList.value = []
    difficulty.value = 'mid'; type.value = 'general'
    companyName.value = ''; jdParsed.value = null
  }

  return {
    interview, qaList, isLoading, error, difficulty, type, companyName, jdParsed,
    isStarted, isCompleted, questionCount, averageScore,
    startInterview, submitAnswer, finishInterview, loadInterview, reset
  }
})
