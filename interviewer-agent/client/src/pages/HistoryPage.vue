<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import * as data from '@/services/data.js'

const router = useRouter()
const interviews = ref([])
const isLoading = ref(true)

onMounted(async () => {
  interviews.value = await data.getInterviews()
  isLoading.value = false
})

function viewReport(item) {
  router.push(`/report/${item.id}`)
}

function continueInterview(item) {
  router.push(`/interview/${item.id}`)
}

async function deleteInterview(item) {
  if (!confirm('确定删除这条面试记录？')) return
  await data.deleteInterview(item.id)
  interviews.value = interviews.value.filter(i => i.id !== item.id)
}

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const difficultyLabels = { small: '小厂', mid: '中厂', big: '大厂' }
const typeLabels = { general: '通用面试', company_specific: '公司面试' }

function getTypeLabel(item) {
  let label = typeLabels[item.type] || item.type
  if (item.companyName) label += ` · ${item.companyName}`
  return label
}
</script>

<template>
  <div class="page">
    <div class="page-title">
      <span>📋 面试历史</span>
      <div style="margin-left:auto;display:flex;gap:8px">
        <button class="btn btn-secondary btn-sm" @click="exportData">📥 导出数据</button>
        <button class="btn btn-secondary btn-sm" @click="triggerImport">📤 导入数据</button>
      </div>
    </div>

    <div v-if="isLoading" class="loading-spinner">加载中...</div>

    <div v-else-if="!interviews.length" class="empty-state">
      <div class="empty-state-icon">📋</div>
      <div class="empty-state-text">还没有面试记录</div>
      <button class="btn btn-primary" @click="router.push('/')">开始第一次面试</button>
    </div>

    <div v-else class="history-list">
      <div v-for="item in interviews" :key="item.id" class="history-item card">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <span class="tag" :class="{
                'tag-yellow': item.difficulty === 'big',
                'tag-green': item.difficulty === 'mid'
              }">{{ difficultyLabels[item.difficulty] || item.difficulty }}</span>
              <span class="tag">{{ getTypeLabel(item) }}</span>
              <span :class="item.status === 'completed' ? 'tag tag-green' : 'tag tag-yellow'">
                {{ item.status === 'completed' ? '✅ 已完成' : '🔄 进行中' }}
              </span>
            </div>
            <div class="text-secondary" style="font-size:12px">
              {{ formatDate(item.startedAt) }}
              <template v-if="item.completedAt">
                → {{ formatDate(item.completedAt) }}
              </template>
            </div>
            <div class="flex gap-3 mt-2 text-secondary" style="font-size:13px">
              <span v-if="item.totalQuestions">📝 {{ item.totalQuestions }}题</span>
              <span v-if="item.averageScore">⭐ {{ item.averageScore }}/5</span>
            </div>
          </div>
          <div class="flex gap-2">
            <button
              v-if="item.status === 'completed'"
              class="btn btn-sm btn-primary"
              @click="viewReport(item)"
            >查看报告</button>
            <button
              v-if="item.status === 'in_progress'"
              class="btn btn-sm btn-primary"
              @click="continueInterview(item)"
            >继续面试</button>
            <button class="btn btn-sm btn-ghost" @click="deleteInterview(item)">🗑</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.history-list { display: flex; flex-direction: column; gap: 12px; }
</style>
