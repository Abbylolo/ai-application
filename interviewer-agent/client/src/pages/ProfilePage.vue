<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user.js'
import SkillRadar from '@/components/profile/SkillRadar.vue'
import ProjectTimeline from '@/components/profile/ProjectTimeline.vue'

const router = useRouter()
const user = useUserStore()
const p = computed(() => user.currentProfile)

const stats = computed(() => {
  if(!p.value?.techStack) return { total:0, proficient:0 }
  return { total: p.value.techStack.length, proficient: p.value.techStack.filter(t=>t.level==='proficient').length }
})
</script>

<template>
  <div class="page" v-if="p">
    <div class="bar">
      <h1 class="h1">📊 技术画像</h1>
      <button class="btn-sm pri" @click="router.push('/setup')">✏️ 编辑</button>
    </div>

    <div class="prof-card">
      <div class="av">{{ p.avatar || '👤' }}</div>
      <div>
        <h2>{{ p.name || '未命名' }}</h2>
        <p>{{ p.position }} · {{ p.yearsOfExperience }}年经验</p>
        <p v-if="p.education?.school" class="sub">🎓 {{ p.education.degree }} · {{ p.education.major }} · {{ p.education.school }}</p>
      </div>
      <div class="st">
        <em>{{ stats.total }}</em><span>技能</span>
        <em>{{ stats.proficient }}</em><span>精通</span>
      </div>
    </div>

    <div class="card" v-if="p.techStack?.length">
      <h3>📈 技能雷达</h3>
      <SkillRadar :techStack="p.techStack" />
    </div>

    <div class="card">
      <h3>📁 项目经验</h3>
      <ProjectTimeline :projects="p.projects" />
    </div>

    <div class="card" v-if="p.strengths?.length || p.weaknesses?.length">
      <h3>🎯 自我评估</h3>
      <div v-if="p.strengths?.length" class="tags"><span v-for="s in p.strengths" :key="s" class="t t-g">💪 {{ s }}</span></div>
      <div v-if="p.weaknesses?.length" class="tags mt-s"><span v-for="w in p.weaknesses" :key="w" class="t t-r">⚠️ {{ w }}</span></div>
    </div>
  </div>
  <div v-else class="page empty"><p>暂无档案</p><button class="btn-sm pri" @click="router.push('/setup')">创建档案</button></div>
</template>

<style scoped>
.page { max-width: 960px; margin: 0 auto; padding: 56px 40px; }
.bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
.h1 { font-size: 24px; font-weight: 800; }
.card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 28px; margin-bottom: 20px; }
.card h3 { font-size: 16px; font-weight: 700; margin: 0 0 20px; }

.prof-card { display: flex; align-items: center; gap: 20px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 28px; margin-bottom: 20px; }
.av { width: 64px; height: 64px; border-radius: 20px; background: var(--accent-bg); display: flex; align-items: center; justify-content: center; font-size: 32px; }
.prof-card h2 { font-size: 20px; font-weight: 700; margin: 0; }
.prof-card p { font-size: 14px; color: var(--text-secondary); margin: 2px 0 0; }
.prof-card .sub { font-size: 13px; color: var(--text-muted); }
.st { display: flex; gap: 6px; align-items: baseline; margin-left: auto; }
.st em { font-size: 22px; font-weight: 800; color: var(--accent-color); font-style: normal; }
.st span { font-size: 11px; color: var(--text-muted); }

.tags { display: flex; gap: 6px; flex-wrap: wrap; }
.t { font-size: 13px; padding: 4px 10px; border-radius: 8px; background: var(--bg-hover); }
.t-g { background: #ecfdf5; color: #065f46; }
.t-r { background: #fef2f2; color: #991b1b; }
.mt-s { margin-top: 10px; }

.empty { text-align: center; color: var(--text-muted); padding: 80px 0; }
.btn-sm { padding: 6px 14px; border: 1.5px solid var(--border-color); border-radius: 9px; background: none; font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; }
.btn-sm.pri { background: var(--accent-color); border-color: var(--accent-color); color: #fff; }
</style>
