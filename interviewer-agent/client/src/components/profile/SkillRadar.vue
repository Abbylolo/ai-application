<script setup>
import { ref, onMounted, watch, nextTick, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  techStack: { type: Array, default: () => [] }
})

const chartContainer = ref(null)
let chart = null

function buildRadarData() {
  const techs = props.techStack || []
  if (!techs.length) return null

  // 按类别分组计算平均掌握度
  const catScores = {}
  const catNames = {
    language: '编程语言', framework: '框架/库', tool: '工具',
    platform: '平台', other: '其他'
  }

  for (const tech of techs) {
    const cat = tech.category || 'other'
    if (!catScores[cat]) catScores[cat] = { total: 0, count: 0 }
    const level = tech.level === 'proficient' ? 5 : tech.level === 'familiar' ? 3 : 1
    catScores[cat].total += level
    catScores[cat].count++
  }

  const indicators = []
  const values = []

  for (const [cat, data] of Object.entries(catScores)) {
    if (data.count > 0) {
      indicators.push({
        name: catNames[cat] || cat,
        max: 5
      })
      values.push(Math.round(data.total / data.count * 10) / 10)
    }
  }

  return { indicators, values }
}

function renderChart() {
  if (!chartContainer.value) return

  const data = buildRadarData()
  if (!data) return

  if (!chart) {
    chart = echarts.init(chartContainer.value)
  }

  chart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        return `${params.name}: ${params.value}/5`
      }
    },
    radar: {
      indicator: data.indicators,
      center: ['50%', '50%'],
      radius: '70%',
      axisName: {
        color: '#6b7280',
        fontSize: 11
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(79, 70, 229, 0.02)', 'rgba(79, 70, 229, 0.04)']
        }
      }
    },
    series: [{
      type: 'radar',
      data: [{
        value: data.values,
        name: '技能掌握度',
        areaStyle: {
          color: 'rgba(79, 70, 229, 0.2)'
        },
        lineStyle: {
          color: '#4f46e5',
          width: 2
        },
        itemStyle: {
          color: '#4f46e5'
        }
      }]
    }]
  })
}

onMounted(() => {
  nextTick(() => renderChart())
})

watch(() => props.techStack, () => {
  nextTick(() => renderChart())
}, { deep: true })

// 响应窗口大小
function handleResize() {
  chart?.resize()
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})
</script>

<template>
  <div class="skill-radar">
    <div v-if="techStack.length < 2" class="empty-state">
      <div class="empty-state-text">至少需要 2 项技能才能生成雷达图</div>
    </div>
    <div v-else ref="chartContainer" class="radar-chart"></div>
  </div>
</template>

<style scoped>
.skill-radar {
  width: 100%;
}
.radar-chart {
  width: 100%;
  height: 320px;
}
</style>
