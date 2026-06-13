<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import * as data from '@/services/data.js'

const router = useRouter()
const interviews = ref([])
const loading = ref(true)

onMounted(async () => { interviews.value = await data.getInterviews(); loading.value = false })

const dl = { small:'小厂', mid:'中厂', big:'大厂' }

async function del(item) {
  if(!confirm('删除？')) return
  await data.deleteInterview(item.id)
  interviews.value = interviews.value.filter(i => i.id !== item.id)
}

async function exp() {
  const all = await data.getInterviews()
  const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `JobPrep_backup_${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="page">
    <div class="bar">
      <h1 class="h1">📋 面试历史</h1>
      <button class="btn-sm" @click="exp">📥 导出</button>
    </div>

    <div v-if="loading" class="empty">加载中...</div>
    <div v-else-if="!interviews.length" class="empty">还没有面试记录</div>

    <div v-else class="list">
      <div v-for="item in interviews" :key="item.id" class="row">
        <div class="row-main" @click="router.push(item.status==='completed'?`/report/${item.id}`:`/interview/${item.id}`)">
          <div class="row-head">
            <span :class="item.difficulty==='big'?'t t-y':item.difficulty==='mid'?'t t-g':'t'">{{ dl[item.difficulty] || item.difficulty }}</span>
            <span class="t">{{ item.companyName || '通用面试' }}</span>
            <span :class="item.status==='completed'?'t t-g':'t t-o'">{{ item.status==='completed'?'已完成':'进行中' }}</span>
            <span v-if="item.averageScore" class="t t-b">{{ item.averageScore }}/5</span>
          </div>
          <div class="row-sub">{{ new Date(item.startedAt).toLocaleString('zh-CN') }}</div>
        </div>
        <button class="btn-sm btn-d" @click.stop="del(item)">删除</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { max-width: 1080px; margin: 0 auto; padding: 56px 40px; }
.bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
.h1 { font-size: 28px; font-weight: 800; }
.empty { text-align: center; color: var(--text-muted); padding: 56px 0; font-size: 14px; }

.list { display: flex; flex-direction: column; gap: 8px; }
.row { display: flex; align-items: center; gap: 12px; padding: 14px 18px; border: 1px solid var(--border-color); border-radius: 12px; transition: border-color .15s; }
.row:hover { border-color: var(--accent-color); }
.row-main { flex: 1; cursor: pointer; }
.row-head { display: flex; gap: 8px; align-items: center; margin-bottom: 4px; flex-wrap: wrap; }
.row-sub { font-size: 12px; color: var(--text-muted); }

.t { font-size: 12px; padding: 2px 8px; border-radius: 9999px; background: var(--bg-hover); color: var(--text-secondary); font-weight: 500; }
.t-y { background: #fffbeb; color: #92400e; }
.t-g { background: #ecfdf5; color: #065f46; }
.t-o { background: #fff7ed; color: #9a3412; }
.t-b { background: var(--accent-bg); color: var(--accent-color); font-weight: 700; }

.btn-sm { padding: 6px 14px; border: 1.5px solid var(--border-color); border-radius: 9px; background: none; font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; color: var(--text-primary); }
.btn-sm:hover { background: var(--bg-hover); }
.btn-d { color: var(--danger); border-color: var(--danger); }
.btn-d:hover { background: #fef2f2; }
</style>
