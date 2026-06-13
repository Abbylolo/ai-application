<script setup>
import { ref, onMounted, nextTick, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import db from '@/db/database.js'
import * as echarts from 'echarts'

const router = useRouter()
const isLoading = ref(true)
const interviews = ref([])
const allQA = ref([])

// 图表容器
const trendChartRef = ref(null)
const categoryChartRef = ref(null)
let trendChart = null
let categoryChart = null

onMounted(async () => {
  // 加载所有已完成的面试
  interviews.value = await db.interviews
    .where('status').equals('completed')
    .reverse()
    .sortBy('completedAt')

  // 加载所有 QA
  const allIds = interviews.value.map(i => i.id)
  const qaArrays = await Promise.all(allIds.map(id =>
    db.interviewQA.where('interviewId').equals(id).toArray()
  ))
  allQA.value = qaArrays.flat()

  isLoading.value = false

  await nextTick()
  renderTrendChart()
  renderCategoryChart()
})

// 薄弱知识点统计
const weakAreas = computed(() => {
  const weaknesses = {}
  for (const qa of allQA.value) {
    if (qa.evaluation?.weaknesses) {
      for (const w of qa.evaluation.weaknesses) {
        weaknesses[w] = (weaknesses[w] || 0) + 1
      }
    }
    if (qa.evaluation?.score != null && qa.evaluation.score <= 2 && qa.question?.category) {
      const cat = qa.question.category
      weaknesses[cat] = (weaknesses[cat] || 0) + 1
    }
  }
  return Object.entries(weaknesses)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
})

// 各维度平均分
const categoryScores = computed(() => {
  const cats = {}
  for (const qa of allQA.value) {
    if (qa.evaluation?.score && qa.question?.category) {
      const cat = qa.question.category
      if (!cats[cat]) cats[cat] = { total: 0, count: 0 }
      cats[cat].total += qa.evaluation.score
      cats[cat].count++
    }
  }
  return Object.entries(cats).map(([cat, data]) => ({
    name: cat,
    avg: Math.round(data.total / data.count * 10) / 10,
    count: data.count
  }))
})

function renderTrendChart() {
  if (!trendChartRef.value || !interviews.value.length) return
  if (!trendChart) trendChart = echarts.init(trendChartRef.value)

  const data = interviews.value
    .filter(i => i.averageScore)
    .map(i => ({
      date: new Date(i.completedAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
      score: i.averageScore
    }))
    .reverse()

  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: data.map(d => d.date),
      axisLabel: { fontSize: 10 }
    },
    yAxis: {
      type: 'value', min: 0, max: 5,
      axisLabel: { fontSize: 10 }
    },
    series: [{
      data: data.map(d => d.score),
      type: 'line',
      smooth: true,
      lineStyle: { color: '#4f46e5', width: 2 },
      areaStyle: { color: 'rgba(79, 70, 229, 0.1)' },
      itemStyle: { color: '#4f46e5' },
      symbol: 'circle',
      symbolSize: 6
    }]
  })
}

function renderCategoryChart() {
  if (!categoryChartRef.value || !categoryScores.value.length) return
  if (!categoryChart) categoryChart = echarts.init(categoryChartRef.value)

  const catLabels = {
    js_basics: 'JS基础', react_vue: '框架', network: '网络',
    algorithm: '算法', engineering: '工程化', system_design: '系统设计',
    css: 'CSS', performance: '性能', general: '综合'
  }

  categoryChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 100, right: 40, top: 10, bottom: 20 },
    xAxis: { type: 'value', min: 0, max: 5, axisLabel: { fontSize: 10 } },
    yAxis: {
      type: 'category',
      data: categoryScores.value.map(c => catLabels[c.name] || c.name).reverse(),
      axisLabel: { fontSize: 11 }
    },
    series: [{
      data: categoryScores.value.map(c => c.avg).reverse(),
      type: 'bar',
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#818cf8' },
          { offset: 1, color: '#4f46e5' }
        ]),
        borderRadius: [0, 4, 4, 0]
      },
      label: { show: true, position: 'right', fontSize: 11 }
    }]
  })
}

function handleResize() {
  trendChart?.resize()
  categoryChart?.resize()
}

onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  categoryChart?.dispose()
})

const totalInterviews = computed(() => interviews.value.length)
const totalQuestions = computed(() => allQA.value.filter(q => q.userAnswer).length)
const overallAvg = computed(() => {
  const scores = interviews.value.filter(i => i.averageScore).map(i => i.averageScore)
  if (!scores.length) return 0
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
})
</script>

<template>
  <div class="page">
    <div class="page-title">📊 面试统计</div>

    <div v-if="isLoading" class="loading-spinner">加载中...</div>

    <template v-else>
      <!-- 概览卡片 -->
      <div class="stats-grid mb-4">
        <div class="stat-card">
          <div class="stat-card-value">{{ totalInterviews }}</div>
          <div class="stat-card-label">完成面试</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-value">{{ totalQuestions }}</div>
          <div class="stat-card-label">总答题数</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-value">{{ overallAvg }}</div>
          <div class="stat-card-label">总均分 /5</div>
        </div>
      </div>

      <!-- 分数趋势 -->
      <div class="card mb-4">
        <div class="card-header">📈 分数趋势</div>
        <div v-if="interviews.filter(i=>i.averageScore).length" ref="trendChartRef" class="chart-box"></div>
        <div v-else class="empty-state"><div class="empty-state-text">暂无数据</div></div>
      </div>

      <!-- 各维度得分 -->
      <div class="card mb-4">
        <div class="card-header">🎯 各维度表现</div>
        <div v-if="categoryScores.length" ref="categoryChartRef" class="chart-box"></div>
        <div v-else class="empty-state"><div class="empty-state-text">暂无数据</div></div>
      </div>

      <!-- 薄弱知识点 -->
      <div class="card">
        <div class="card-header">⚠️ 高频薄弱点</div>
        <div v-if="weakAreas.length" class="weak-list">
          <div v-for="([name, count], idx) in weakAreas" :key="name" class="weak-item">
            <span class="weak-rank">#{{ idx + 1 }}</span>
            <span class="weak-name flex-1">{{ name }}</span>
            <span class="weak-count">{{ count }}次</span>
          </div>
        </div>
        <div v-else class="empty-state"><div class="empty-state-text">暂无数据，继续面试积累吧</div></div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.stats-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
}
.stat-card {
  text-align: center; padding: 20px; background: var(--bg-card);
  border: 1px solid var(--border-color); border-radius: var(--radius-lg);
}
.stat-card-value { font-size: 32px; font-weight: 700; color: var(--accent-color); }
.stat-card-label { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }

.chart-box { width: 100%; height: 280px; }

.weak-list { display: flex; flex-direction: column; gap: 6px; }
.weak-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; background: var(--bg-hover); border-radius: var(--radius-sm);
}
.weak-rank { font-weight: 700; color: var(--accent-color); font-size: 12px; min-width: 24px; }
.weak-name { font-size: 13px; }
.weak-count { font-size: 12px; color: var(--danger); font-weight: 600; }
</style>
