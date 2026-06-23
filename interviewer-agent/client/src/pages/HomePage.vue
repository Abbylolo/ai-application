<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user.js'
import { useSettingsStore } from '@/stores/settings.js'
import * as data from '@/services/data.js'

const router = useRouter()
const userStore = useUserStore()
const settingsStore = useSettingsStore()
const recentInterviews = ref([])
const stats = ref({ total: 0, avg: 0 })

onMounted(async () => {
  const all = await data.getInterviews()
  recentInterviews.value = all.slice(0, 4)
  const done = all.filter(i => i.status === 'completed')
  stats.value.total = done.length
  stats.value.avg = done.length ? Math.round(done.reduce((s, i) => s + (i.averageScore || 0), 0) / done.length * 10) / 10 : 0
})

const diffLabels = { small: '小厂', mid: '中厂', big: '大厂' }

function goInterview(mode) {
  if (mode === 'company') {
    router.push('/company')
    return
  }
  if (!settingsStore.currentConfig) { alert('请先配置模型'); router.push('/settings'); return }
  if (!userStore.currentProfile) { router.push('/setup'); return }
  router.push('/interview')
}
</script>

<template>
  <div class="page">
    <div class="hero">
      <div>
        <h1>Hi, {{ userStore.currentProfile?.name || '准备面试吧' }}</h1>
        <p>今天想练习什么难度？</p>
      </div>
      <div v-if="stats.total" class="hero-stat">
        <em>{{ stats.total }}</em><span>场完成</span>
        <em>{{ stats.avg }}</em><span>均分</span>
      </div>
    </div>

    <div class="actions">
      <button class="act" @click="goInterview('general')">
        <span class="act-icon">🎯</span>
        <strong>通用模拟面试</strong>
        <span>大厂·中厂·小厂 自由切换</span>
      </button>
      <button class="act" @click="goInterview('company')">
        <span class="act-icon">🏢</span>
        <strong>公司特定面试</strong>
        <span>上传 JD · 精准匹配</span>
      </button>
      <button class="act" @click="router.push('/history')">
        <span class="act-icon">📋</span>
        <strong>面试历史</strong>
        <span>回顾记录 · 追踪成长</span>
      </button>
    </div>

    <div v-if="recentInterviews.length" class="recent">
      <h3>最近记录</h3>
      <div class="r-list">
        <div v-for="item in recentInterviews" :key="item.id" class="r-item" @click="router.push(item.status === 'completed' ? `/report/${item.id}` : `/interview/${item.id}`)">
          <span>{{ item.companyName || diffLabels[item.difficulty] || item.difficulty }}</span>
          <span>{{ item.status === 'completed' ? '✅' : '🔄' }}</span>
          <span class="r-time">{{ new Date(item.startedAt).toLocaleDateString('zh-CN', { month:'short', day:'numeric' }) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { max-width: 1080px; margin: 0 auto; padding: 56px 40px; }
.hero { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 36px; }
.hero h1 { font-size: 26px; font-weight: 800; margin: 0; color: var(--text-primary); }
.hero p { font-size: 15px; color: var(--text-secondary); margin: 6px 0 0; }
.hero-stat { display: flex; gap: 8px; align-items: baseline; }
.hero-stat em { font-size: 24px; font-weight: 800; color: var(--accent-color); font-style: normal; }
.hero-stat span { font-size: 12px; color: var(--text-muted); }

.actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 44px; }
.act { padding: 24px 20px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; cursor: pointer; display: flex; flex-direction: column; gap: 6px; text-align: left; transition: all .15s; }
.act:hover { border-color: var(--accent-color); box-shadow: 0 4px 16px rgba(0,0,0,.04); transform: translateY(-1px); }
.act-icon { font-size: 28px; }
.act strong { font-size: 15px; color: var(--text-primary); }
.act span { font-size: 13px; color: var(--text-secondary); }

.recent h3 { font-size: 16px; font-weight: 700; margin-bottom: 14px; }
.r-list { display: flex; flex-direction: column; gap: 6px; }
.r-item { display: flex; gap: 16px; align-items: center; padding: 10px 16px; border-radius: 10px; cursor: pointer; font-size: 14px; transition: background .1s; }
.r-item:hover { background: var(--bg-hover); }
.r-time { color: var(--text-muted); font-size: 12px; margin-left: auto; }

@media (max-width: 600px) {
  .actions { grid-template-columns: 1fr; }
  .hero { flex-direction: column; gap: 12px; }
}
</style>
