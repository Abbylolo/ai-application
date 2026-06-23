<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/settings.js'
import { useUserStore } from '@/stores/user.js'
import { parseJD, searchInterviewExperience } from '@/services/api.js'
import * as data from '@/services/data.js'

const router = useRouter()
const settingsStore = useSettingsStore()
const userStore = useUserStore()

const form = reactive({
  id: '',
  companyName: '',
  position: '',
  jdContent: '',
  jdParsed: null,
  searchResults: [],
  questions: [],
  tags: []
})
const realQA = reactive({ question: '', answer: '' })
const records = ref([])
const parsing = ref(false)
const searching = ref(false)
const saving = ref(false)
const selectedId = ref('')
const activeTab = ref('jd')

const canSearch = computed(() => form.companyName.trim())
const canStart = computed(() => form.companyName.trim() && form.jdContent.trim())

onMounted(loadRecords)

async function loadRecords() {
  records.value = await data.getCompanyQuestions()
}

function resetForm() {
  Object.assign(form, {
    id: '',
    companyName: '',
    position: '',
    jdContent: '',
    jdParsed: null,
    searchResults: [],
    questions: [],
    tags: []
  })
  selectedId.value = ''
  Object.assign(realQA, { question: '', answer: '' })
  activeTab.value = 'jd'
}

function loadRecord(record) {
  Object.assign(form, {
    id: record.id,
    companyName: record.companyName || '',
    position: record.position || '',
    jdContent: record.jdContent || '',
    jdParsed: record.jdParsed || null,
    searchResults: record.searchResults || [],
    questions: record.questions || [],
    tags: record.tags || []
  })
  selectedId.value = String(record.id)
  activeTab.value = 'jd'
}

async function handleParse() {
  if (!form.jdContent.trim()) return
  if (!settingsStore.currentConfig) {
    alert('请先配置模型，才能解析 JD')
    router.push('/settings')
    return
  }
  parsing.value = true
  try {
    const result = await parseJD(form.jdContent)
    if (!result.error) {
      form.jdParsed = result
      form.position = result.position || form.position
      form.tags = result.requiredSkills || form.tags
      if (form.companyName.trim()) await saveRecord(false)
      if (form.companyName.trim()) await handleSearch()
    }
  } finally {
    parsing.value = false
  }
}

async function handleSearch() {
  if (!canSearch.value) return
  searching.value = true
  try {
    const position = form.position || form.jdParsed?.position || '前端开发'
    const result = await searchInterviewExperience(form.companyName, position)
    form.searchResults = result.results || []
    await saveRecord(false)
  } finally {
    searching.value = false
  }
}

function addRealQA() {
  if (!realQA.question.trim() || !realQA.answer.trim()) return
  form.questions.unshift({
    id: crypto.randomUUID?.() || String(Date.now()),
    question: realQA.question.trim(),
    answer: realQA.answer.trim(),
    source: 'real_interview',
    createdAt: new Date().toISOString()
  })
  Object.assign(realQA, { question: '', answer: '' })
}

function removeQA(id) {
  form.questions = form.questions.filter(item => item.id !== id)
}

function resultHref(url) {
  if (!url) return undefined
  return `https://${String(url).replace(/^https?:\/\//, '')}`
}

async function saveRecord(showTip = true) {
  if (!form.companyName.trim()) return null
  saving.value = true
  try {
    const saved = await data.saveCompanyQuestion({
      id: form.id,
      companyName: form.companyName.trim(),
      position: form.position || form.jdParsed?.position || '',
      jdContent: form.jdContent,
      jdParsed: form.jdParsed,
      searchResults: form.searchResults,
      source: 'user_upload',
      questions: form.questions,
      tags: form.tags?.length ? form.tags : (form.jdParsed?.requiredSkills || [])
    })
    await loadRecords()
    loadRecord(saved)
    if (showTip) alert('已保存公司面试资料')
    return saved
  } finally {
    saving.value = false
  }
}

async function startInterview() {
  if (!settingsStore.currentConfig) { alert('请先配置模型'); router.push('/settings'); return }
  if (!userStore.currentProfile) { alert('请先创建我的档案，面试官会结合你的背景提问'); router.push('/setup'); return }
  if (!canStart.value) { alert('请先填写公司名称和岗位 JD'); return }

  if (!form.searchResults.length) await handleSearch()
  const saved = await saveRecord(false)
  const context = {
    recordId: saved?.id || form.id,
    company: form.companyName.trim(),
    jdInfo: {
      ...(form.jdParsed || {}),
      position: form.position || form.jdParsed?.position,
      jdContent: form.jdContent,
      searchResults: form.searchResults,
      questions: form.questions
    }
  }
  sessionStorage.setItem('companyInterviewContext', JSON.stringify(context))
  router.push({ path: '/interview', query: { company: context.company, companyRecordId: context.recordId } })
}
</script>

<template>
  <div class="page">
    <div class="head">
      <div>
        <h1 class="h1">公司特定面试</h1>
        <p>上传岗位 JD 后，自动检索面经，并沉淀真实面试 Q&A 到公司题库。</p>
      </div>
      <button class="btn-sm" @click="resetForm">新建公司记录</button>
    </div>

    <div class="layout">
      <section class="card editor">
        <div class="tabs">
          <button :class="{ on: activeTab === 'jd' }" @click="activeTab = 'jd'">JD 与面经</button>
          <button :class="{ on: activeTab === 'qa' }" @click="activeTab = 'qa'">真实 Q&A</button>
        </div>

        <template v-if="activeTab === 'jd'">
          <div class="grid-2">
            <div class="fld">
              <label>公司名称</label>
              <input v-model="form.companyName" placeholder="例如：字节跳动" />
            </div>
            <div class="fld">
              <label>目标岗位</label>
              <input v-model="form.position" placeholder="例如：前端开发工程师" />
            </div>
          </div>

          <div class="fld">
            <label>岗位描述 JD</label>
            <textarea v-model="form.jdContent" rows="8" placeholder="粘贴岗位职责、任职要求、技术栈要求等信息..." />
          </div>

          <div class="acts">
            <button class="btn-sm pri" :disabled="!form.jdContent.trim() || parsing" @click="handleParse">{{ parsing ? '解析中...' : '解析 JD' }}</button>
            <button class="btn-sm" :disabled="!canSearch || searching" @click="handleSearch">{{ searching ? '检索中...' : '检索面经' }}</button>
            <button class="btn-sm" :disabled="saving || !form.companyName.trim()" @click="saveRecord()">{{ saving ? '保存中...' : '保存资料' }}</button>
          </div>

          <div v-if="form.jdParsed" class="panel">
            <strong>{{ form.jdParsed.position || form.position || '岗位解析结果' }}</strong>
            <span v-if="form.jdParsed.level"> · {{ form.jdParsed.level }}</span>
            <div class="tags" v-if="form.jdParsed.requiredSkills?.length">
              <span v-for="skill in form.jdParsed.requiredSkills" :key="skill" class="tag">{{ skill }}</span>
            </div>
          </div>

          <div class="panel">
            <div class="panel-title">面经检索结果</div>
            <div v-if="!form.searchResults.length" class="empty">还没有检索结果</div>
            <a v-for="(item, index) in form.searchResults" :key="index" class="result" :href="resultHref(item.url)" target="_blank">
              <span>{{ item.snippet }}</span>
              <small v-if="item.url">{{ item.url }}</small>
            </a>
          </div>
        </template>

        <template v-else>
          <div class="qa-form">
            <div class="fld">
              <label>真实面试问题</label>
              <textarea v-model="realQA.question" rows="3" placeholder="记录真实面试中被问到的问题..." />
            </div>
            <div class="fld">
              <label>你的回答 / 面试官反馈</label>
              <textarea v-model="realQA.answer" rows="4" placeholder="记录当时的回答、追问、反馈或复盘..." />
            </div>
            <div class="acts">
              <button class="btn-sm pri" @click="addRealQA">加入题库</button>
              <button class="btn-sm" :disabled="saving || !form.companyName.trim()" @click="saveRecord()">{{ saving ? '保存中...' : '保存 Q&A' }}</button>
            </div>
          </div>

          <div class="panel">
            <div class="panel-title">公司真实面试记录</div>
            <div v-if="!form.questions.length" class="empty">还没有真实 Q&A</div>
            <div v-for="item in form.questions" :key="item.id" class="qa-item">
              <button class="del" title="移除" @click="removeQA(item.id)">×</button>
              <strong>Q：{{ item.question }}</strong>
              <p>A：{{ item.answer }}</p>
            </div>
          </div>
        </template>

        <div class="start-bar">
          <button class="btn-lg pri" :disabled="!canStart || saving" @click="startInterview">开始针对性面试模拟</button>
        </div>
      </section>

      <aside class="card library">
        <div class="card-hd">
          <span>已保存公司</span>
          <small>{{ records.length }} 条</small>
        </div>
        <div v-if="!records.length" class="empty">暂无公司记录</div>
        <button v-for="record in records" :key="record.id" class="record" :class="{ active: selectedId === String(record.id) }" @click="loadRecord(record)">
          <strong>{{ record.companyName }}</strong>
          <span>{{ record.position || '未指定岗位' }}</span>
          <small>{{ record.searchResults?.length || 0 }} 条面经 · {{ record.questions?.length || 0 }} 条 Q&A</small>
        </button>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.page { max-width: 1180px; margin: 0 auto; padding: 48px 40px; }
.head { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; margin-bottom: 24px; }
.h1 { font-size: 28px; font-weight: 800; margin: 0 0 6px; }
.head p { margin: 0; color: var(--text-secondary); font-size: 14px; }
.layout { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 18px; align-items: flex-start; }
.card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; }
.tabs { display: inline-flex; padding: 4px; border-radius: 12px; background: var(--bg-hover); margin-bottom: 20px; }
.tabs button { border: none; background: transparent; color: var(--text-secondary); padding: 8px 14px; border-radius: 9px; font-weight: 600; cursor: pointer; }
.tabs button.on { background: var(--bg-card); color: var(--accent-color); box-shadow: 0 1px 4px rgba(0,0,0,.08); }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.fld { margin-bottom: 14px; }
.fld label { display: block; font-size: 13px; font-weight: 650; color: var(--text-secondary); margin-bottom: 6px; }
.fld input, .fld textarea { width: 100%; padding: 10px 13px; border: 1.5px solid var(--border-color); border-radius: 10px; font-size: 14px; font-family: inherit; background: var(--bg-primary); color: var(--text-primary); resize: vertical; box-sizing: border-box; }
.fld input:focus, .fld textarea:focus { border-color: var(--accent-color); box-shadow: 0 0 0 3px rgba(79,70,229,.08); outline: none; }
.acts { display: flex; gap: 8px; flex-wrap: wrap; }
.panel { margin-top: 16px; padding: 16px; background: var(--bg-hover); border-radius: 12px; font-size: 14px; }
.panel-title { font-weight: 750; margin-bottom: 10px; }
.tags { margin-top: 10px; display: flex; gap: 6px; flex-wrap: wrap; }
.tag { font-size: 12px; padding: 3px 8px; border-radius: 999px; background: var(--bg-card); color: var(--text-secondary); }
.result { display: block; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 10px; background: var(--bg-card); color: var(--text-primary); text-decoration: none; margin-top: 8px; }
.result span { display: block; line-height: 1.55; }
.result small { display: block; margin-top: 5px; color: var(--text-muted); word-break: break-all; }
.empty { color: var(--text-muted); font-size: 13px; padding: 10px 0; }
.qa-item { position: relative; padding: 14px 40px 14px 14px; border: 1px solid var(--border-color); border-radius: 12px; background: var(--bg-card); margin-top: 10px; }
.qa-item strong { display: block; line-height: 1.5; }
.qa-item p { margin: 8px 0 0; color: var(--text-secondary); line-height: 1.6; white-space: pre-wrap; }
.del { position: absolute; right: 10px; top: 10px; border: none; background: transparent; color: var(--text-muted); font-size: 20px; cursor: pointer; }
.start-bar { margin-top: 20px; padding-top: 18px; border-top: 1px solid var(--border-color); }
.library { position: sticky; top: 24px; }
.card-hd { display: flex; justify-content: space-between; align-items: center; font-weight: 750; margin-bottom: 14px; }
.card-hd small { color: var(--text-muted); font-weight: 500; }
.record { width: 100%; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; padding: 13px 14px; border: 1px solid var(--border-color); border-radius: 12px; background: transparent; color: var(--text-primary); cursor: pointer; margin-bottom: 8px; text-align: left; }
.record:hover, .record.active { border-color: var(--accent-color); background: var(--accent-bg); }
.record span { color: var(--text-secondary); font-size: 13px; }
.record small { color: var(--text-muted); font-size: 12px; }
.btn-sm, .btn-lg { border: 1.5px solid var(--border-color); border-radius: 10px; background: none; color: var(--text-primary); font-weight: 650; cursor: pointer; font-family: inherit; }
.btn-sm { padding: 8px 14px; font-size: 13px; }
.btn-lg { padding: 11px 22px; font-size: 14px; }
.btn-sm:hover, .btn-lg:hover { background: var(--bg-hover); }
.btn-sm:disabled, .btn-lg:disabled { opacity: .45; cursor: not-allowed; }
.pri { background: var(--accent-color); border-color: var(--accent-color); color: #fff; }
.pri:hover { background: #4338ca; }
@media (max-width: 900px) {
  .layout, .grid-2 { grid-template-columns: 1fr; }
  .library { position: static; }
}
</style>
