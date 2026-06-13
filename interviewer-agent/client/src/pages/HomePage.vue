<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user.js'
import { useSettingsStore } from '@/stores/settings.js'
import { useInterviewStore } from '@/stores/interview.js'
import db from '@/db/database.js'

const router = useRouter()
const userStore = useUserStore()
const settingsStore = useSettingsStore()
const interviewStore = useInterviewStore()

const recentInterviews = ref([])

onMounted(async () => {
  recentInterviews.value = await db.interviews
    .orderBy('startedAt')
    .reverse()
    .limit(5)
    .toArray()
})

function startGeneralInterview() {
  if (!settingsStore.currentConfig) {
    alert('请先在设置中配置模型')
    router.push('/settings')
    return
  }
  if (!userStore.currentProfile) {
    router.push('/setup')
    return
  }
  router.push('/interview')
}

function startCompanyInterview() {
  if (!settingsStore.currentConfig) {
    alert('请先在设置中配置模型')
    router.push('/settings')
    return
  }
  if (!userStore.currentProfile) {
    router.push('/setup')
    return
  }
  router.push('/company')
}

function continueInterview(item) {
  router.push(`/interview/${item.id}`)
}

function viewReport(item) {
  router.push(`/report/${item.id}`)
}

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  })
}

const difficultyLabels = { small: '小厂', mid: '中厂', big: '大厂' }
</script>

<template>
  <div class="page">
    <div class="page-title">
      <span>🤖</span>
      <span>面试官 Agent</span>
    </div>
    <div class="page-subtitle">模拟真实技术面试，提升面试能力</div>

    <!-- 当前状态 -->
    <div class="profile-banner card mb-4" v-if="userStore.currentProfile">
      <div class="flex items-center gap-3">
        <div class="profile-avatar">👤</div>
        <div>
          <div class="profile-name">
            {{ userStore.currentProfile.name || '未命名' }}
            <span class="text-secondary" style="font-weight:400;margin-left:8px">
              {{ userStore.currentProfile.position || '未设置岗位' }}
            </span>
          </div>
          <div class="text-secondary" style="font-size:13px">
            {{ userStore.currentProfile.yearsOfExperience || 0 }}年经验 ·
            {{ userStore.currentProfile.techStack?.length || 0 }}项技能
            <template v-if="settingsStore.currentConfig">
              · 当前模型：{{ settingsStore.currentConfig.name }}
            </template>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" @click="router.push('/setup')" style="margin-left:auto">编辑</button>
      </div>
    </div>

    <!-- 没有配置模型的提示 -->
    <div v-if="!settingsStore.currentConfig" class="error-message">
      ⚠️ 请先在<a href="#/settings" style="color:var(--danger);text-decoration:underline">设置页</a>配置模型，否则无法使用面试功能
    </div>

    <!-- 没有简历的提示 -->
    <div v-if="!userStore.currentProfile" class="card mb-4" style="background:var(--accent-bg);border-color:var(--accent-color)">
      <div class="flex items-center gap-3">
        <span style="font-size:32px">📝</span>
        <div class="flex-1">
          <div style="font-weight:600">创建你的技术档案</div>
          <div class="text-secondary" style="font-size:13px">上传简历自动解析，或手动填写</div>
        </div>
        <button class="btn btn-primary" @click="router.push('/setup')">创建档案</button>
      </div>
    </div>

    <!-- 开始面试 -->
    <div class="action-grid">
      <button class="action-card" @click="startGeneralInterview">
        <span class="action-icon">🎯</span>
        <span class="action-title">通用模拟面试</span>
        <span class="action-desc">选择大厂/中厂/小厂难度，全面考察技术深度</span>
      </button>

      <button class="action-card" @click="startCompanyInterview">
        <span class="action-icon">🏢</span>
        <span class="action-title">公司特定面试</span>
        <span class="action-desc">针对目标公司，上传岗位描述，精准模拟</span>
      </button>

      <button class="action-card" @click="router.push('/history')">
        <span class="action-icon">📋</span>
        <span class="action-title">面试历史</span>
        <span class="action-desc">回顾过往面试记录，追踪改进进度</span>
      </button>
    </div>

    <!-- 最近面试 -->
    <div v-if="recentInterviews.length" class="mt-6">
      <div class="card-header">📌 最近面试</div>
      <div class="recent-list">
        <div v-for="item in recentInterviews" :key="item.id" class="recent-item">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="tag" :class="{
                'tag-yellow': item.difficulty === 'big',
                'tag-green': item.difficulty === 'mid'
              }">{{ difficultyLabels[item.difficulty] || item.difficulty }}</span>
              <span v-if="item.companyName" class="tag">{{ item.companyName }}</span>
              <span :class="item.status === 'completed' ? 'tag tag-green' : 'tag tag-yellow'">
                {{ item.status === 'completed' ? '已完成' : '进行中' }}
              </span>
            </div>
            <div class="text-secondary mt-2" style="font-size:12px">
              {{ formatDate(item.startedAt) }}
              <template v-if="item.averageScore"> · 均分 {{ item.averageScore }}/5</template>
            </div>
          </div>
          <div class="flex gap-2">
            <button
              v-if="item.status === 'in_progress'"
              class="btn btn-sm btn-primary"
              @click="continueInterview(item)"
            >继续</button>
            <button
              v-if="item.status === 'completed'"
              class="btn btn-sm btn-secondary"
              @click="viewReport(item)"
            >查看报告</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-banner { }
.profile-avatar {
  width: 48px; height: 48px; border-radius: 50%;
  background: var(--accent-bg); display: flex;
  align-items: center; justify-content: center; font-size: 24px;
}
.profile-name { font-size: 16px; font-weight: 700; }

.action-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px;
}

.action-card {
  background: var(--bg-card); border: 1px solid var(--border-color);
  border-radius: var(--radius-lg); padding: 20px;
  display: flex; flex-direction: column; gap: 8px;
  cursor: pointer; transition: all 0.15s; text-align: left;
}
.action-card:hover {
  border-color: var(--accent-color);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.action-icon { font-size: 28px; }
.action-title { font-size: 15px; font-weight: 700; }
.action-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.4; }

.recent-list { display: flex; flex-direction: column; gap: 8px; }
.recent-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}
.recent-item:hover { background: var(--bg-hover); }
</style>
