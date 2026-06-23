<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user.js'
import { useSettingsStore } from '@/stores/settings.js'
import { useInterviewStore } from '@/stores/interview.js'
import ChatPanel from '@/components/chat/ChatPanel.vue'
import AnswerInput from '@/components/chat/AnswerInput.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const settingsStore = useSettingsStore()
const interviewStore = useInterviewStore()

const showSetup = ref(false)
const selectedDifficulty = ref('mid')
const errorMsg = ref('')
const elapsed = ref(0)
let timer = null

// 面试计时
const interviewTime = computed(() => {
  const m = Math.floor(elapsed.value / 60)
  const s = elapsed.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

function startTimer() {
  timer = setInterval(() => { elapsed.value++ }, 1000)
}
function stopTimer() { clearInterval(timer) }
onUnmounted(stopTimer)

onMounted(async () => {
  // 如果是恢复面试
  if (route.params.id) {
    await interviewStore.loadInterview(route.params.id)
    if (!interviewStore.interview) { router.push('/'); return }
    // 计算已过时间
    const start = new Date(interviewStore.interview.startedAt).getTime()
    elapsed.value = Math.floor((Date.now() - start) / 1000)
    startTimer()
    return
  }

  // 检查前置条件
  if (!settingsStore.currentConfig) {
    errorMsg.value = '请先在设置中配置模型'
    return
  }
  if (!userStore.currentProfile) {
    errorMsg.value = '请先创建技术档案'
    return
  }

  // 公司特定面试：直接从 CompanyPage 跳转过来
  if (route.query.company) {
    interviewStore.type = 'company_specific'
    interviewStore.companyName = route.query.company
    const storedContext = sessionStorage.getItem('companyInterviewContext')
    if (storedContext) {
      try {
        const context = JSON.parse(storedContext)
        if (context.company === route.query.company) {
          interviewStore.jdParsed = context.jdInfo
        }
      } catch { /* ignore parse error */ }
    } else if (route.query.jdInfo) {
      try {
        interviewStore.jdParsed = JSON.parse(decodeURIComponent(route.query.jdInfo))
      } catch { /* ignore parse error */ }
    }
    // 直接开始面试，跳过难度选择
    await startCompanyInterview()
    return
  }

  showSetup.value = true
})

async function startInterview() {
  showSetup.value = false
  errorMsg.value = ''
  try {
    await interviewStore.startInterview(userStore.currentProfile, {
      difficulty: selectedDifficulty.value,
      type: 'general',
      reviewMode: settingsStore.reviewMode
    })
    elapsed.value = 0
    startTimer()
  } catch (err) {
    errorMsg.value = '启动面试失败：' + err.message
    showSetup.value = true
  }
}

async function startCompanyInterview() {
  showSetup.value = false
  errorMsg.value = ''

  try {
    await interviewStore.startInterview(userStore.currentProfile, {
      difficulty: selectedDifficulty.value,
      type: 'company_specific',
      reviewMode: settingsStore.reviewMode,
      companyName: interviewStore.companyName,
      jdInfo: interviewStore.jdParsed
    })
  } catch (err) {
    errorMsg.value = '启动面试失败：' + err.message
    showSetup.value = true
  }
}

async function handleSubmitAnswer(answer) {
  try {
    await interviewStore.submitAnswer(answer, userStore.currentProfile)
  } catch (err) {
    errorMsg.value = '提交失败：' + err.message
  }
}

async function handleFinish() {
  if (!confirm('确定结束面试吗？结束后将生成评估报告。')) return
  stopTimer()
  try {
    const result = await interviewStore.finishInterview(userStore.currentProfile)
    router.push(`/report/${interviewStore.interview.id}`)
  } catch (err) {
    errorMsg.value = '生成报告失败：' + err.message
  }
}

const difficultyLabels = { small: '小厂', mid: '中厂', big: '大厂' }
const difficultyDescs = {
  small: 'JS基础、CSS、框架使用，追问1次，轻松友好',
  mid: 'JS深入、框架原理、工程化，追问2-3次，深挖项目',
  big: 'JS底层、框架源码、系统设计、算法，持续深挖，高压面试'
}

// 判断当前是否在等待用户回答（最后一条是问题且未回答）
const isWaitingAnswer = () => {
  const last = interviewStore.qaList[interviewStore.qaList.length - 1]
  return last && !last.userAnswer
}
</script>

<template>
  <div class="interview-page">
    <!-- 错误 -->
    <div v-if="errorMsg" class="page" style="padding:32px">
      <div class="error-message">{{ errorMsg }}</div>
      <button class="btn btn-primary mt-4" @click="router.push('/')">返回首页</button>
    </div>

    <!-- 面试前设置 -->
    <div v-else-if="showSetup" class="page" style="padding:32px">
      <div class="page-title">🎯 开始模拟面试</div>
      <div class="card">
        <div class="card-header">选择难度等级</div>
        <div class="difficulty-grid">
          <label
            v-for="diff in ['small', 'mid', 'big']" :key="diff"
            class="difficulty-card"
            :class="{ 'difficulty-card--active': selectedDifficulty === diff }"
          >
            <input type="radio" v-model="selectedDifficulty" :value="diff" hidden />
            <span class="diff-icon">{{ diff === 'small' ? '🌱' : diff === 'mid' ? '🔥' : '👑' }}</span>
            <span class="diff-name">{{ difficultyLabels[diff] }}面试官</span>
            <span class="diff-desc">{{ difficultyDescs[diff] }}</span>
          </label>
        </div>
        <div class="mt-4 text-center">
          <p class="text-secondary mb-2">
            评审模式：{{ settingsStore.reviewMode === 'instant' ? '即时点评（每题后评分+标准答案）' : '整体总结（面试完毕统一评估）' }}
          </p>
          <button class="btn btn-primary btn-lg" @click="startInterview">
            🚀 开始面试
          </button>
        </div>
      </div>
    </div>

    <!-- 面试进行中 -->
    <template v-else-if="interviewStore.isStarted">
      <!-- 顶部信息栏 -->
      <header class="topbar">
        <div class="tb-left">
          <div class="tb-badge">🤖</div>
          <div>
            <div class="tb-title">面试进行中</div>
            <div class="tb-meta">
              <span class="tb-time">⏱ {{ interviewTime }}</span>
              <span>·</span>
              <span>{{ difficultyLabels[interviewStore.difficulty] || interviewStore.difficulty }}</span>
              <span>·</span>
              <span>{{ interviewStore.questionCount }} 题</span>
            </div>
          </div>
        </div>
        <button class="tb-end" @click="handleFinish">结束面试</button>
      </header>

      <!-- 聊天区 -->
      <ChatPanel
        :qaList="interviewStore.qaList"
        :isLoading="interviewStore.isLoading"
        :interviewType="interviewStore.type"
        :companyName="interviewStore.companyName"
        :reviewMode="interviewStore.interview?.reviewMode || 'instant'"
        :userName="userStore.currentProfile?.name || '你'"
        :userAvatar="userStore.currentProfile?.avatar || '👤'"
      />

      <!-- 输入区 -->
      <AnswerInput
        :disabled="interviewStore.isLoading || !isWaitingAnswer()"
        @submit="handleSubmitAnswer"
      />
    </template>

    <!-- 加载中 -->
    <div v-else class="loading-spinner" style="height:100vh">加载中...</div>
  </div>
</template>

<style scoped>
.interview-page {
  display: flex; flex-direction: column; height: 100vh;
}

.topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 24px; border-bottom: 1px solid var(--border-color);
  background: var(--bg-card); flex-shrink: 0;
}
.tb-left { display: flex; align-items: center; gap: 12px; }
.tb-badge { width: 38px; height: 38px; border-radius: 12px; background: var(--accent-bg); display: flex; align-items: center; justify-content: center; font-size: 18px; }
.tb-title { font-weight: 700; font-size: 14px; color: var(--text-primary); }
.tb-meta { display: flex; gap: 8px; font-size: 12px; color: var(--text-muted); margin-top: 2px; }
.tb-time { color: var(--accent-color); font-weight: 600; font-variant-numeric: tabular-nums; }
.tb-end { padding: 7px 16px; border: 1.5px solid var(--danger); border-radius: 10px; background: none; color: var(--danger); font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; transition: all .15s; }
.tb-end:hover { background: #fef2f2; }

.difficulty-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
}

.difficulty-card {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 24px 16px; border: 2px solid var(--border-color);
  border-radius: var(--radius-lg); cursor: pointer; transition: all 0.15s;
  text-align: center;
}
.difficulty-card:hover { border-color: var(--accent-color); }
.difficulty-card--active {
  border-color: var(--accent-color);
  background: var(--accent-bg);
}
.diff-icon { font-size: 36px; }
.diff-name { font-size: 16px; font-weight: 700; }
.diff-desc { font-size: 12px; color: var(--text-secondary); line-height: 1.4; }
</style>
