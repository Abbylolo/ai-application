<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import QuestionCard from './QuestionCard.vue'

const props = defineProps({
  qaList: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  interviewType: { type: String, default: 'general' },
  companyName: { type: String, default: '' },
  reviewMode: { type: String, default: 'instant' }
})

const chatContainer = ref(null)

// 自动滚动到底部
watch(() => props.qaList.length, async () => {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
})

onMounted(async () => {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
})

const categoryLabels = {
  js_basics: 'JS基础', react_vue: '框架', network: '网络',
  algorithm: '算法', engineering: '工程化', system_design: '系统设计',
  css: 'CSS', performance: '性能', general: '综合'
}
</script>

<template>
  <div class="chat-panel" ref="chatContainer">
    <!-- 欢迎消息 -->
    <div v-if="!qaList.length && !isLoading" class="chat-welcome">
      <div class="welcome-icon">🤖</div>
      <h3>面试官已就位</h3>
      <p class="text-secondary">
        <template v-if="interviewType === 'company_specific' && companyName">
          这是 {{ companyName }} 的特定面试，题目将结合岗位要求
        </template>
        <template v-else>
          准备好后请点击"开始面试"，面试官将根据你的背景提出技术问题
        </template>
      </p>
    </div>

    <!-- 问答列表 -->
    <div v-for="(qa, idx) in qaList" :key="idx" class="chat-round">
      <!-- 面试官问题 -->
      <div class="chat-bubble chat-bubble--interviewer">
        <div class="bubble-avatar">🤖</div>
        <div class="bubble-content">
          <div class="bubble-role">面试官</div>
          <div v-if="qa.question?.text" class="bubble-text">
            {{ qa.question.text }}
          </div>
          <div v-if="qa.question?.category" class="bubble-meta">
            <span class="tag">{{ categoryLabels[qa.question.category] || qa.question.category }}</span>
            <span class="tag">难度 {{ '⭐'.repeat(qa.question.difficulty || 1) }}</span>
            <span v-if="qa.question.tags?.length">
              <span v-for="tag in qa.question.tags" :key="tag" class="tag">{{ tag }}</span>
            </span>
            <span v-if="qa.type === 'followup'" class="tag tag-yellow">追问</span>
          </div>
        </div>
      </div>

      <!-- 用户回答 -->
      <div v-if="qa.userAnswer" class="chat-bubble chat-bubble--user">
        <div class="bubble-content">
          <div class="bubble-role">你的回答</div>
          <div class="bubble-text user-answer">{{ qa.userAnswer }}</div>
        </div>
        <div class="bubble-avatar">👤</div>
      </div>

      <!-- 评估结果（即时点评模式才显示） -->
      <div v-if="qa.evaluation && reviewMode === 'instant'" class="chat-evaluation">
        <div class="eval-header">
          <span class="eval-score">
            {{ '⭐'.repeat(qa.evaluation.score || 0) }}
            <span class="eval-score-num">{{ qa.evaluation.score }}/5</span>
          </span>
        </div>
        <div class="eval-feedback">{{ qa.evaluation.feedback }}</div>
        <div v-if="qa.evaluation.strengths?.length" class="eval-strengths">
          <span v-for="s in qa.evaluation.strengths" :key="s" class="tag tag-green">✅ {{ s }}</span>
        </div>
        <div v-if="qa.evaluation.weaknesses?.length" class="eval-weaknesses mt-2">
          <span v-for="w in qa.evaluation.weaknesses" :key="w" class="tag tag-red">⚠️ {{ w }}</span>
        </div>
      </div>

      <!-- 参考答案（即时点评模式才显示） -->
      <div v-if="qa.evaluation && qa.question?.referenceAnswer && reviewMode === 'instant'" class="chat-reference">
        <details>
          <summary>📖 查看参考答案要点</summary>
          <div class="reference-content">{{ qa.question.referenceAnswer }}</div>
        </details>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="isLoading" class="chat-bubble chat-bubble--interviewer">
      <div class="bubble-avatar">🤖</div>
      <div class="bubble-content">
        <div class="bubble-role">面试官</div>
        <div class="typing-indicator">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-panel {
  flex: 1; overflow-y: auto; padding: 20px;
}

.chat-welcome {
  text-align: center; padding: 48px 24px;
}
.welcome-icon { font-size: 48px; margin-bottom: 12px; }
.chat-welcome h3 { font-size: 18px; margin-bottom: 8px; }
.chat-welcome p { max-width: 400px; margin: 0 auto; }

.chat-round { margin-bottom: 20px; }

.chat-bubble {
  display: flex; gap: 10px; margin-bottom: 12px;
}
.chat-bubble--user { justify-content: flex-end; }
.chat-bubble--interviewer { justify-content: flex-start; }

.bubble-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--bg-hover); display: flex;
  align-items: center; justify-content: center; font-size: 16px;
  flex-shrink: 0;
}
.bubble-content { max-width: 80%; }
.bubble-role { font-size: 12px; color: var(--text-muted); margin-bottom: 4px; }
.bubble-text {
  background: var(--bg-card); border: 1px solid var(--border-color);
  border-radius: var(--radius-md); padding: 12px 16px;
  font-size: 14px; line-height: 1.7; white-space: pre-wrap;
}
.chat-bubble--user .bubble-text {
  background: var(--accent-bg); border-color: var(--accent-color);
}
.bubble-meta { margin-top: 6px; display: flex; gap: 4px; flex-wrap: wrap; }

/* 评估卡片 */
.chat-evaluation {
  background: #fefce8; border: 1px solid #fde68a;
  border-radius: var(--radius-md); padding: 12px 16px;
  margin: 8px 0 8px 42px;
}
.eval-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.eval-score { font-size: 14px; }
.eval-score-num { font-weight: 700; color: var(--text-primary); margin-left: 4px; font-size: 13px; }
.eval-feedback { font-size: 13px; line-height: 1.6; color: var(--text-primary); }
.eval-strengths { margin-top: 8px; display: flex; gap: 4px; flex-wrap: wrap; }
.eval-weaknesses { display: flex; gap: 4px; flex-wrap: wrap; }

/* 参考答案 */
.chat-reference {
  margin: 8px 0 8px 42px;
}
.chat-reference details {
  font-size: 13px;
}
.chat-reference summary {
  cursor: pointer; color: var(--accent-color); font-weight: 500;
}
.reference-content {
  margin-top: 8px; padding: 12px;
  background: var(--bg-code); border-radius: var(--radius-sm);
  font-size: 13px; line-height: 1.6; white-space: pre-wrap;
}

/* 打字动画 */
.typing-indicator {
  display: flex; gap: 4px; padding: 12px 16px;
  background: var(--bg-card); border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}
.typing-indicator span {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--text-muted);
  animation: typing 1.4s infinite both;
}
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-4px); opacity: 1; }
}
</style>
