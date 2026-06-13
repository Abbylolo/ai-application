<script setup>
import { ref, onMounted, nextTick, onUnmounted, computed } from 'vue'
import * as data from '@/services/data.js'

const loading = ref(true)
const interviews = ref([])
const allQA = ref([])
const trendRef = ref(null)
const catRef = ref(null)
let tChart = null, cChart = null, echarts = null

onMounted(async () => {
  const all = await data.getInterviews()
  interviews.value = all.filter(i => i.status === 'completed')
  const qas = await Promise.all(interviews.value.map(i => data.getQA(i.id)))
  allQA.value = qas.flat()
  loading.value = false
  await nextTick()
  echarts = await import('echarts')
  renderTrend(); renderCat()
})

function renderTrend() {
  if(!trendRef.value || !interviews.value.length) return
  if(!tChart) tChart = echarts.init(trendRef.value)
  const d = interviews.value.filter(i=>i.averageScore).map(i=>({d:new Date(i.completedAt).toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit'}),s:i.averageScore})).reverse()
  tChart.setOption({ tooltip:{trigger:'axis'}, grid:{left:40,right:20,top:10,bottom:20}, xAxis:{type:'category',data:d.map(x=>x.d),axisLabel:{fontSize:10}}, yAxis:{type:'value',min:0,max:5}, series:[{data:d.map(x=>x.s),type:'line',smooth:true,lineStyle:{color:'#4f46e5',width:2},areaStyle:{color:'rgba(79,70,229,.08)'},itemStyle:{color:'#4f46e5'},symbol:'circle',symbolSize:5}] })
}
function renderCat() {
  if(!catRef.value || !allQA.value.length) return
  if(!cChart) cChart = echarts.init(catRef.value)
  const cl = {js_basics:'JS',react_vue:'框架',network:'网络',algorithm:'算法',engineering:'工程化',system_design:'系统设计',css:'CSS',performance:'性能',general:'综合'}
  const cats = {}
  for(const q of allQA.value) { if(q.evaluation?.score&&q.question?.category){ const c=q.question.category; if(!cats[c]) cats[c]={t:0,n:0}; cats[c].t+=q.evaluation.score; cats[c].n++ } }
  const cd = Object.entries(cats).map(([k,v])=>({name:cl[k]||k,avg:Math.round(v.t/v.n*10)/10})).sort((a,b)=>a.avg-b.avg)
  cChart.setOption({ tooltip:{trigger:'axis'}, grid:{left:90,right:30,top:10,bottom:20}, xAxis:{type:'value',min:0,max:5}, yAxis:{type:'category',data:cd.map(x=>x.name),axisLabel:{fontSize:11}}, series:[{data:cd.map(x=>x.avg),type:'bar',itemStyle:{color:new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:'#818cf8'},{offset:1,color:'#4f46e5'}]),borderRadius:[0,4,4,0]},label:{show:true,position:'right',fontSize:11}}] })
}
onUnmounted(() => { tChart?.dispose(); cChart?.dispose() })

const total = computed(() => interviews.value.length)
const questions = computed(() => allQA.value.filter(q=>q.userAnswer).length)
const avg = computed(() => { const s=interviews.value.filter(i=>i.averageScore).map(i=>i.averageScore); return s.length?Math.round(s.reduce((a,b)=>a+b,0)/s.length*10)/10:0 })
</script>

<template>
  <div class="page">
    <h1 class="h1">📊 面试统计</h1>
    <div v-if="loading" class="empty">加载中...</div>
    <template v-else>
      <div class="nums">
        <div class="nm"><em>{{ total }}</em><span>完成面试</span></div>
        <div class="nm"><em>{{ questions }}</em><span>总答题</span></div>
        <div class="nm"><em>{{ avg }}</em><span>均分/5</span></div>
      </div>
      <div class="card"><h3>📈 分数趋势</h3><div ref="trendRef" class="chart" v-if="interviews.filter(i=>i.averageScore).length"></div><div v-else class="empty">暂无数据</div></div>
      <div class="card"><h3>🎯 各维度表现</h3><div ref="catRef" class="chart" v-if="allQA.length"></div><div v-else class="empty">暂无数据</div></div>
    </template>
  </div>
</template>

<style scoped>
.page { max-width: 960px; margin: 0 auto; padding: 56px 40px; }
.h1 { font-size: 24px; font-weight: 800; margin-bottom: 28px; }
.card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 28px; margin-bottom: 20px; }
.card h3 { font-size: 16px; font-weight: 700; margin: 0 0 16px; }
.chart { width: 100%; height: 260px; }
.empty { text-align: center; color: var(--text-muted); padding: 40px 0; font-size: 14px; }

.nums { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 28px; }
.nm { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 24px; text-align: center; }
.nm em { display: block; font-size: 30px; font-weight: 800; color: var(--accent-color); font-style: normal; }
.nm span { font-size: 12px; color: var(--text-muted); margin-top: 4px; display: block; }
</style>
