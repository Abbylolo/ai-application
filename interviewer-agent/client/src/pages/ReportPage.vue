<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useInterviewStore } from '@/stores/interview.js'
import { marked } from 'marked'
import db from '@/db/database.js'

const router = useRouter()
const route = useRoute()
const interviewStore = useInterviewStore()

const renderedHTML = ref('')
const copied = ref(false)
const flaggedIds = ref(new Set())

// 加载已标记的 QA
async function loadFlagged() {
  const flagged = await db.interviewQA
    .where({ interviewId: parseInt(route.params.id), isFlagged: 1 })
    .toArray()
  flaggedIds.value = new Set(flagged.map(q => q.id))
}

async function toggleFlag(qaId) {
  if (flaggedIds.value.has(qaId)) {
    await db.interviewQA.update(qaId, { isFlagged: 0 })
    flaggedIds.value.delete(qaId)
  } else {
    await db.interviewQA.update(qaId, { isFlagged: 1 })
    flaggedIds.value.add(qaId)
  }
  // 强制刷新
  flaggedIds.value = new Set(flaggedIds.value)
}

// 已回答的问题列表
const answeredQA = computed(() =>
  interviewStore.qaList.filter(q => q.userAnswer && q.evaluation)
)

onMounted(async () => {
  const id = route.params.id
  if (!id) {
    router.push('/history')
    return
  }

  await interviewStore.loadInterview(id)

  if (!interviewStore.interview) {
    router.push('/history')
    return
  }

  await loadFlagged()

  if (interviewStore.interview.reportMarkdown) {
    renderedHTML.value = marked(interviewStore.interview.reportMarkdown)
  }
})

function exportMarkdown() {
  const md = interviewStore.interview?.reportMarkdown
  if (!md) return

  const blob = new Blob([md], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `面试报告_${new Date().toISOString().slice(0, 10)}.md`
  a.click()
  URL.revokeObjectURL(url)
}

function exportPDF() {
  // 使用浏览器打印
  window.print()
}

function copyReport() {
  const md = interviewStore.interview?.reportMarkdown
  if (!md) return
  navigator.clipboard.writeText(md)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}

const difficultyLabels = { small: '小厂', mid: '中厂', big: '大厂' }
</script>

<template>
  <div class="page">
    <div v-if="interviewStore.interview" class="report-page">
      <!-- 操作栏 -->
      <div class="flex justify-between items-center mb-4">
        <button class="btn btn-ghost" @click="router.push('/history')">← 返回历史</button>
        <div class="flex gap-2">
          <button class="btn btn-secondary btn-sm" @click="copyReport">
            {{ copied ? '✅ 已复制' : '📋 复制' }}
          </button>
          <button class="btn btn-secondary btn-sm" @click="exportMarkdown">📥 导出MD</button>
          <button class="btn btn-secondary btn-sm" @click="exportPDF">🖨 导出PDF</button>
        </div>
      </div>

      <!-- 报告预览 -->
      <div class="card mb-4">
        <div class="report-content" v-html="renderedHTML"></div>
      </div>

      <!-- 面试回放 -->
      <div class="card">
        <div class="card-header">▶️ 面试回放 & 标记复习</div>
        <div v-if="!answeredQA.length" class="empty-state">
          <div class="empty-state-text">暂无问答记录</div>
        </div>
        <div v-else class="replay-list">
          <div v-for="qa in answeredQA" :key="qa.id" class="replay-item">
            <div class="replay-q">
              <div class="flex justify-between items-start">
                <strong>Q{{ qa.sequenceNumber }}:</strong>
                <button
                  class="btn btn-sm"
                  :class="flaggedIds.has(qa.id) ? 'btn-danger' : 'btn-ghost'"
                  @click="toggleFlag(qa.id)"
                >
                  {{ flaggedIds.has(qa.id) ? '🏴 已标记复习' : '🏳 标记复习' }}
                </button>
              </div>
              <p class="mt-2">{{ qa.question?.text || '（无题目文本）' }}</p>
            </div>
            <div class="replay-a">
              <strong>你的回答：</strong>
              <p class="mt-2">{{ qa.userAnswer }}</p>
            </div>
            <div class="replay-eval">
              <span class="tag" :class="{
                'tag-green': qa.evaluation?.score >= 4,
                'tag-yellow': qa.evaluation?.score === 3,
                'tag-red': qa.evaluation?.score <= 2
              }">评分 {{ '⭐'.repeat(qa.evaluation?.score || 0) }} ({{ qa.evaluation?.score }}/5)</span>
              <span class="text-secondary ml-2" style="font-size:13px">{{ qa.evaluation?.feedback }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="loading-spinner">加载报告中...</div>
  </div>
</template>

<style scoped>
.report-page { }
.report-content {
  font-size: 14px; line-height: 1.8;
}

/* Markdown 样式 */
.report-content :deep(h1) {
  font-size: 24px; margin-bottom: 16px; padding-bottom: 8px;
  border-bottom: 2px solid var(--border-color);
}
.report-content :deep(h2) {
  font-size: 18px; margin-top: 24px; margin-bottom: 12px;
}
.report-content :deep(h3) {
  font-size: 15px; margin-top: 16px; margin-bottom: 8px;
}
.report-content :deep(table) {
  width: 100%; border-collapse: collapse; margin: 12px 0;
}
.report-content :deep(th),
.report-content :deep(td) {
  padding: 8px 12px; border: 1px solid var(--border-color);
  text-align: left;
}
.report-content :deep(th) {
  background: var(--bg-hover); font-weight: 600;
}
.report-content :deep(hr) {
  border: none; border-top: 1px solid var(--border-color);
  margin: 16px 0;
}
.report-content :deep(blockquote) {
  border-left: 3px solid var(--accent-color);
  padding: 8px 16px; color: var(--text-secondary);
  background: var(--bg-hover); margin: 12px 0;
}
.report-content :deep(ul), .report-content :deep(ol) {
  padding-left: 24px; margin: 8px 0;
}
.report-content :deep(li) { margin-bottom: 4px; }
.report-content :deep(code) {
  background: var(--bg-code); padding: 2px 6px; border-radius: 4px;
  font-size: 13px;
}

.replay-list { display: flex; flex-direction: column; gap: 12px; }
.replay-item {
  padding: 16px; border: 1px solid var(--border-color);
  border-radius: var(--radius-md); background: var(--bg-hover);
}
.replay-q { margin-bottom: 12px; }
.replay-q p { font-size: 14px; color: var(--text-primary); line-height: 1.6; }
.replay-a {
  padding: 10px 14px; background: var(--accent-bg);
  border-radius: var(--radius-sm); margin-bottom: 8px;
  border-left: 3px solid var(--accent-color);
}
.replay-a p { font-size: 13px; color: var(--text-primary); line-height: 1.6; }
.replay-eval { display: flex; align-items: center; }

.ml-2 { margin-left: 8px; }

/* 打印样式 */
@media print {
  .sidebar, .btn, .interview-header { display: none !important; }
  .main-content { padding: 0 !important; }
  .report-content { font-size: 12px; }
}
</style>
