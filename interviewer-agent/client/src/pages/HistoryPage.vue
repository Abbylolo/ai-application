<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import db from '@/db/database.js'

const router = useRouter()
const interviews = ref([])
const isLoading = ref(true)

onMounted(async () => {
  interviews.value = await db.interviews
    .orderBy('startedAt')
    .reverse()
    .toArray()
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
  // 删除关联的 QA
  await db.interviewQA.where('interviewId').equals(item.id).delete()
  await db.interviews.delete(item.id)
  interviews.value = interviews.value.filter(i => i.id !== item.id)
}

// 数据导出
async function exportData() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    profiles: await db.userProfiles.toArray(),
    interviews: await db.interviews.toArray(),
    interviewQA: await db.interviewQA.toArray(),
    companyQuestionBank: await db.companyQuestionBank.toArray(),
    modelConfigs: await db.modelConfigs.toArray()
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `面试官Agent_数据备份_${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// 数据导入
const importInput = ref(null)
function triggerImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = handleImportFile
  input.click()
}

async function handleImportFile(e) {
  const file = e.target.files[0]
  if (!file) return

  try {
    const text = await file.text()
    const data = JSON.parse(text)

    if (!data.version || !data.interviews) {
      alert('无效的备份文件')
      return
    }

    if (!confirm(`即将导入 ${data.interviews.length} 条面试记录、${data.profiles?.length || 0} 个档案。确定继续？`)) return

    // 导入数据
    if (data.profiles) {
      for (const p of data.profiles) {
        const existing = await db.userProfiles.get(p.id)
        if (!existing) await db.userProfiles.put(p)
      }
    }
    if (data.interviews) {
      for (const i of data.interviews) {
        const existing = await db.interviews.get(i.id)
        if (!existing) await db.interviews.put(i)
      }
    }
    if (data.interviewQA) {
      for (const qa of data.interviewQA) {
        const existing = await db.interviewQA.get(qa.id)
        if (!existing) await db.interviewQA.put(qa)
      }
    }
    if (data.companyQuestionBank) {
      for (const c of data.companyQuestionBank) {
        const existing = await db.companyQuestionBank.get(c.id)
        if (!existing) await db.companyQuestionBank.put(c)
      }
    }
    if (data.modelConfigs) {
      for (const m of data.modelConfigs) {
        const existing = await db.modelConfigs.get(m.id)
        if (!existing) await db.modelConfigs.put(m)
      }
    }

    alert('导入成功！请刷新页面查看。')
    location.reload()
  } catch (err) {
    alert('导入失败：' + err.message)
  }
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
