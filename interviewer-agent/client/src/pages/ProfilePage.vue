<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user.js'

const router = useRouter()
const userStore = useUserStore()

const profile = computed(() => userStore.currentProfile)

// 技能按类别分组
const skillsByCategory = computed(() => {
  if (!profile.value?.techStack) return {}
  const cats = {}
  for (const tech of profile.value.techStack) {
    const cat = tech.category || 'other'
    if (!cats[cat]) cats[cat] = []
    cats[cat].push(tech)
  }
  return cats
})

const categoryLabels = { language: '语言', framework: '框架/库', tool: '工具', platform: '平台', other: '其他' }
const levelLabels = { proficient: '精通', familiar: '熟悉', learning: '学习中' }

// 技能数量统计
const skillStats = computed(() => {
  const techs = profile.value?.techStack || []
  return {
    total: techs.length,
    proficient: techs.filter(t => t.level === 'proficient').length,
    familiar: techs.filter(t => t.level === 'familiar').length,
    learning: techs.filter(t => t.level === 'learning').length
  }
})

if (!profile.value) {
  router.push('/setup')
}
</script>

<template>
  <div class="page" v-if="profile">
    <div class="page-title">
      <span>📊</span>
      <span>技术画像</span>
      <button class="btn btn-secondary btn-sm" @click="router.push('/setup')" style="margin-left:auto">✏️ 编辑</button>
    </div>

    <!-- 基本信息卡片 -->
    <div class="profile-header card mb-4">
      <div class="profile-avatar-lg">👤</div>
      <div class="profile-meta">
        <h2>{{ profile.name || '未命名' }}</h2>
        <p class="text-secondary">
          {{ profile.position || '未设置岗位' }}
          <template v-if="profile.yearsOfExperience"> · {{ profile.yearsOfExperience }}年经验</template>
        </p>
        <p v-if="profile.education?.school" class="text-secondary" style="font-size:13px">
          🎓 {{ profile.education.degree }} · {{ profile.education.major }} · {{ profile.education.school }}
        </p>
        <div class="flex gap-2 mt-2" v-if="profile.strengths?.length">
          <span v-for="s in profile.strengths" :key="s" class="tag tag-green">💪 {{ s }}</span>
        </div>
      </div>
    </div>

    <!-- 技能概览 -->
    <div class="card mb-4">
      <div class="card-header">📈 技能概览</div>
      <div class="skill-stats">
        <div class="stat-item">
          <div class="stat-value">{{ skillStats.total }}</div>
          <div class="stat-label">技能总数</div>
        </div>
        <div class="stat-item stat-item--green">
          <div class="stat-value">{{ skillStats.proficient }}</div>
          <div class="stat-label">精通</div>
        </div>
        <div class="stat-item stat-item--yellow">
          <div class="stat-value">{{ skillStats.familiar }}</div>
          <div class="stat-label">熟悉</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ skillStats.learning }}</div>
          <div class="stat-label">学习中</div>
        </div>
      </div>
    </div>

    <!-- 技能分类 -->
    <div class="card mb-4">
      <div class="card-header">💻 技术栈详情</div>
      <div v-for="(skills, cat) in skillsByCategory" :key="cat" class="skill-category mb-4">
        <h4 class="category-title">{{ categoryLabels[cat] || cat }}</h4>
        <div class="skill-bars">
          <div v-for="tech in skills" :key="tech.name" class="skill-bar-item">
            <div class="skill-bar-header">
              <span class="skill-bar-name">{{ tech.name }}</span>
              <span class="skill-bar-level text-secondary">{{ levelLabels[tech.level] || tech.level }}</span>
            </div>
            <div class="skill-bar-track">
              <div
                class="skill-bar-fill"
                :class="{
                  'fill-proficient': tech.level === 'proficient',
                  'fill-familiar': tech.level === 'familiar',
                  'fill-learning': tech.level === 'learning'
                }"
                :style="{ width: tech.level === 'proficient' ? '85%' : tech.level === 'familiar' ? '55%' : '25%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="!profile.techStack?.length" class="empty-state">
        <div class="empty-state-text">暂无技术栈信息</div>
      </div>
    </div>

    <!-- 项目时间线 -->
    <div class="card mb-4">
      <div class="card-header">📁 项目经验</div>
      <div v-if="profile.projects?.length" class="project-timeline">
        <div v-for="(proj, idx) in profile.projects" :key="idx" class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <div class="flex justify-between items-center">
              <h4>{{ proj.name || '未命名项目' }}</h4>
              <span v-if="proj.duration" class="text-secondary" style="font-size:12px">{{ proj.duration }}</span>
            </div>
            <p v-if="proj.description" class="text-secondary mt-2">{{ proj.description }}</p>
            <div class="flex gap-2 mt-2" v-if="proj.techUsed?.length">
              <span v-for="tech in (Array.isArray(proj.techUsed) ? proj.techUsed : proj.techUsed.split(','))" :key="tech" class="tag">{{ tech.trim() }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <div class="empty-state-text">暂无项目经验</div>
      </div>
    </div>

    <!-- 需要提升 -->
    <div class="card" v-if="profile.weaknesses?.length">
      <div class="card-header">🎯 重点关注</div>
      <div class="flex gap-2">
        <span v-for="w in profile.weaknesses" :key="w" class="tag tag-red">⚠️ {{ w }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-header {
  display: flex; align-items: center; gap: 20px;
}
.profile-avatar-lg {
  width: 72px; height: 72px; border-radius: 50%;
  background: var(--accent-bg); display: flex;
  align-items: center; justify-content: center; font-size: 36px;
}
.profile-meta h2 { font-size: 20px; margin-bottom: 4px; }
.profile-meta p { margin-bottom: 2px; }

.skill-stats {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
}
.stat-item {
  text-align: center; padding: 16px;
  background: var(--bg-hover); border-radius: var(--radius-md);
}
.stat-item--green { background: #ecfdf5; }
.stat-item--yellow { background: #fffbeb; }
.stat-value { font-size: 28px; font-weight: 700; color: var(--text-primary); }
.stat-label { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }

.skill-category { }
.category-title {
  font-size: 14px; font-weight: 600; margin-bottom: 12px;
  padding-bottom: 6px; border-bottom: 1px solid var(--border-color);
}
.skill-bars { display: flex; flex-direction: column; gap: 10px; }
.skill-bar-item { }
.skill-bar-header {
  display: flex; justify-content: space-between; margin-bottom: 4px;
  font-size: 13px;
}
.skill-bar-name { font-weight: 500; }
.skill-bar-level { font-size: 12px; }
.skill-bar-track {
  height: 6px; background: var(--bg-hover); border-radius: 3px; overflow: hidden;
}
.skill-bar-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
.fill-proficient { background: var(--accent-color); }
.fill-familiar { background: var(--warning); }
.fill-learning { background: var(--text-muted); }

.project-timeline { position: relative; padding-left: 20px; }
.project-timeline::before {
  content: ''; position: absolute; left: 6px; top: 0; bottom: 0;
  width: 2px; background: var(--border-color);
}
.timeline-item { position: relative; margin-bottom: 20px; }
.timeline-dot {
  position: absolute; left: -18px; top: 6px;
  width: 10px; height: 10px; border-radius: 50%;
  background: var(--accent-color); border: 2px solid var(--bg-card);
}
.timeline-content {
  padding: 12px 16px; background: var(--bg-hover);
  border-radius: var(--radius-md);
}
.timeline-content h4 { font-size: 14px; color: var(--text-primary); }
</style>
