<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'

const props = defineProps({
  qaList: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  interviewType: { type: String, default: 'general' },
  companyName: { type: String, default: '' },
  reviewMode: { type: String, default: 'instant' },
  userName: { type: String, default: '你' },
  userAvatar: { type: String, default: '👤' }
})

const chatContainer = ref(null)

function scrollBottom() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTo({ top: chatContainer.value.scrollHeight, behavior: 'smooth' })
    }
  })
}

watch(() => props.qaList.length, scrollBottom)
watch(() => props.isLoading, scrollBottom)
onMounted(scrollBottom)

const catLabels = {
  js_basics: 'JS基础', react_vue: '框架', network: '网络',
  algorithm: '算法', engineering: '工程化', system_design: '系统设计',
  css: 'CSS', performance: '性能', general: '综合'
}
</script>

<template>
  <div class="chat" ref="chatContainer">
    <div v-if="!qaList.length && !isLoading" class="welcome">
      <div class="w-icon">
        <svg viewBox="0 0 40 40" fill="none" width="40" height="40">
          <circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="1.5" opacity=".3"/>
          <circle cx="20" cy="16" r="5" stroke="currentColor" stroke-width="1.5"/>
          <path d="M10 32c0-5.5 4.5-10 10-10s10 4.5 10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
      <h3>面试官就位</h3>
      <p>
        {{ interviewType === 'company_specific' && companyName ? `针对 ${companyName} 的定制面试，已结合岗位要求` : '准备好了就开始吧，面试官会根据你的背景提问' }}
      </p>
    </div>

    <div v-for="(qa, idx) in qaList" :key="idx" class="round">
      <!-- 面试官消息 -->
      <div class="msg msg-ai">
        <div class="av">🤖</div>
        <div class="body">
          <div class="name">面试官</div>
          <div v-if="qa.question?.text" class="bubble ai">{{ qa.question.text }}</div>
          <div v-if="qa.question?.category" class="meta">
            <span>{{ catLabels[qa.question.category] || qa.question.category }}</span>
            <span>{{ '⭐'.repeat(qa.question.difficulty || 1) }}</span>
            <span v-if="qa.type === 'followup'" class="followup">追问</span>
          </div>
        </div>
      </div>

      <!-- 用户消息 -->
      <div v-if="qa.userAnswer" class="msg msg-me">
        <div class="body">
          <div class="name">{{ userName }}</div>
          <div class="bubble me">{{ qa.userAnswer }}</div>
        </div>
        <div class="av">{{ userAvatar }}</div>
      </div>

      <!-- 评估 -->
      <div v-if="qa.evaluation && reviewMode === 'instant'" class="eval">
        <div class="eval-top">
          <span class="score">评分 {{ '⭐'.repeat(qa.evaluation.score || 0) }} {{ qa.evaluation.score }}/5</span>
        </div>
        <p class="eval-text">{{ qa.evaluation.feedback }}</p>
        <div v-if="qa.evaluation.strengths?.length" class="eval-tags pos">
          <span v-for="s in qa.evaluation.strengths" :key="s">✅ {{ s }}</span>
        </div>
        <div v-if="qa.evaluation.weaknesses?.length" class="eval-tags neg">
          <span v-for="w in qa.evaluation.weaknesses" :key="w">⚠️ {{ w }}</span>
        </div>
      </div>

      <!-- 参考答案 -->
      <div v-if="qa.evaluation && qa.question?.referenceAnswer && reviewMode === 'instant'" class="ref">
        <details>
          <summary>📖 参考答案</summary>
          <p>{{ qa.question.referenceAnswer }}</p>
        </details>
      </div>
    </div>

    <!-- 加载 -->
    <div v-if="isLoading" class="msg msg-ai">
      <div class="av">🤖</div>
      <div class="body">
        <div class="name">面试官正在思考...</div>
        <div class="bubble ai typing">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat {
  flex: 1;
  overflow-y: auto;
  padding: 28px 32px;
  display: flex;
  flex-direction: column;
  gap: 28px;
  scroll-behavior: smooth;
}

/* === 欢迎 === */
.welcome {
  text-align: center;
  padding: 64px 24px 32px;
  margin: auto;
}
.w-icon {
  width: 72px; height: 72px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, #eef2ff, #e0e7ff);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #4f46e5;
}
.welcome h3 { font-size: 20px; font-weight: 700; margin-bottom: 8px; color: var(--text-primary); }
.welcome p { font-size: 14px; color: var(--text-secondary); max-width: 360px; margin: 0 auto; line-height: 1.6; }

/* === 一轮消息 === */
.round {
  animation: msgIn .35s ease;
}
@keyframes msgIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* === 消息行 === */
.msg {
  display: flex; gap: 12px;
  margin-bottom: 10px;
}
.msg-me { justify-content: flex-end; }
.msg-ai { justify-content: flex-start; }

.av {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: var(--bg-hover);
  display: flex; align-items: center; justify-content: center;
  font-size: 17px; flex-shrink: 0;
}
.body { max-width: 76%; }
.name {
  font-size: 12px; color: var(--text-muted);
  margin-bottom: 5px; font-weight: 500;
}
.msg-me .name { text-align: right; }

/* === 气泡 === */
.bubble {
  padding: 14px 18px;
  border-radius: 16px;
  font-size: 14.5px; line-height: 1.72;
  white-space: pre-wrap; word-break: break-word;
}
.bubble.ai {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-top-left-radius: 6px;
  box-shadow: 0 1px 2px rgba(0,0,0,.03);
}
.bubble.me {
  background: var(--accent-bg);
  border: 1px solid rgba(79,70,229,.15);
  border-top-right-radius: 6px;
  color: var(--text-primary);
}

/* === 元数据标签 === */
.meta {
  margin-top: 8px; display: flex; gap: 6px; flex-wrap: wrap;
}
.meta span {
  font-size: 11.5px; padding: 2px 8px;
  border-radius: 9999px;
  background: var(--bg-hover); color: var(--text-secondary);
  font-weight: 500;
}
.meta .followup { background: #fffbeb; color: #b45309; }

/* === 评估 === */
.eval {
  margin: 6px 0 6px 48px;
  padding: 16px 18px;
  border-radius: 14px;
  background: #fffbeb;
  border: 1px solid #fde68a;
}
.eval-top { margin-bottom: 8px; }
.score { font-size: 14px; font-weight: 700; color: #92400e; }
.eval-text { font-size: 13.5px; line-height: 1.6; color: #78350f; margin: 0; }
.eval-tags { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 10px; }
.eval-tags span { font-size: 12px; padding: 3px 9px; border-radius: 9999px; font-weight: 500; }
.pos span { background: #ecfdf5; color: #065f46; }
.neg span { background: #fef2f2; color: #991b1b; }

/* === 参考答案 === */
.ref {
  margin: 4px 0 6px 48px;
}
.ref details { font-size: 13px; }
.ref summary {
  cursor: pointer; color: var(--accent-color); font-weight: 600; padding: 6px 0;
}
.ref p {
  margin: 0; padding: 14px 16px;
  background: var(--bg-code); border-radius: 10px;
  font-size: 13px; line-height: 1.65; white-space: pre-wrap;
}

/* === 打字 === */
.bubble.typing {
  display: flex; gap: 5px; padding: 16px 20px;
}
.bubble.typing span {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--text-muted);
  animation: dot 1.3s infinite both;
}
.bubble.typing span:nth-child(2) { animation-delay: .18s; }
.bubble.typing span:nth-child(3) { animation-delay: .36s; }
@keyframes dot {
  0%, 60%, 100% { opacity: .3; transform: scale(.85); }
  30% { opacity: 1; transform: scale(1.1); }
}
</style>
