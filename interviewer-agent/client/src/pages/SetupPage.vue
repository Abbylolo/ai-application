<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user.js'
import { useSettingsStore } from '@/stores/settings.js'
import { parseResume } from '@/services/api.js'

const router = useRouter()
const userStore = useUserStore()
const settingsStore = useSettingsStore()

const isEditing = ref(false)
const isLoading = ref(true)
const hasProfile = ref(false)

const isParsing = ref(false)
const parseError = ref('')
const resumeText = ref('')
const parseElapsed = ref(0)
const parseProgress = ref(0)
const parseStep = ref('')
let parseTimer = null
let stepIndex = 0

const parseSteps = ['正在发送请求...', '正在识别技术栈...', '正在分析项目经验...', '正在整理教育背景...', '正在汇总结果...']

const resumeFile = ref(null)
const isExtractingPDF = ref(false)

const form = ref({
  name: '', position: '', yearsOfExperience: 0,
  techStack: [], projects: [], education: { degree: '', major: '', school: '' },
  strengths: '', weaknesses: '', resumeRaw: ''
})

// 辅助函数
function ensureArray(val) { return Array.isArray(val) ? val : typeof val === 'string' ? val.split(',').map(s => s.trim()).filter(Boolean) : [] }
function ensureString(val) { return Array.isArray(val) ? val.join(', ') : val || '' }

async function loadProfile() {
  isLoading.value = true
  try {
    await userStore.loadProfiles()
    const profile = userStore.currentProfile
    if (profile) {
      hasProfile.value = true
      // 保持 id，让后续保存走更新逻辑
      form.value = {
        id: profile.id,
        name: profile.name || '', position: profile.position || '',
        yearsOfExperience: profile.yearsOfExperience || 0,
        techStack: profile.techStack || [],
        projects: (profile.projects || []).map(proj => ({
          ...proj,
          techUsed: ensureString(proj.techUsed)
        })),
        education: profile.education || { degree: '', major: '', school: '' },
        strengths: ensureString(profile.strengths),
        weaknesses: ensureString(profile.weaknesses),
        resumeRaw: profile.resumeRaw || ''
      }
    } else {
      hasProfile.value = false
      form.value.id = undefined
    }
  } catch (e) {
    console.error('加载档案失败:', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(loadProfile)

// 技能
const newSkillName = ref(''), newSkillCategory = ref('framework'), newSkillLevel = ref('proficient')
function addSkill() {
  if (!newSkillName.value.trim()) return
  form.value.techStack.push({ name: newSkillName.value.trim(), category: newSkillCategory.value, level: newSkillLevel.value })
  newSkillName.value = ''
}
function removeSkill(index) { form.value.techStack.splice(index, 1) }

// PDF 上传
async function handleFileUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  resumeFile.value = file
  parseError.value = ''
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    isExtractingPDF.value = true
    try {
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString()
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      let fullText = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        fullText += content.items.map(item => item.str).join(' ') + '\n'
      }
      resumeText.value = fullText
      form.value.resumeRaw = fullText
    } catch (err) { parseError.value = 'PDF 解析失败，请粘贴文本' }
    finally { isExtractingPDF.value = false }
  } else {
    const reader = new FileReader()
    reader.onload = ev => { resumeText.value = ev.target.result; form.value.resumeRaw = ev.target.result }
    reader.readAsText(file)
  }
}

// AI 解析
async function handleParseResume() {
  if (!resumeText.value.trim()) { parseError.value = '请先上传简历或粘贴文本'; return }
  if (!settingsStore.currentConfig) { parseError.value = '请先在设置中配置模型'; return }
  isParsing.value = true; parseError.value = ''; parseElapsed.value = 0; parseProgress.value = 0
  stepIndex = 0; parseStep.value = parseSteps[0]
  parseTimer = setInterval(() => {
    parseElapsed.value++
    parseProgress.value = Math.min(90, Math.floor(parseElapsed.value * 2.5))
    const newIdx = Math.min(Math.floor(parseProgress.value / 20), parseSteps.length - 1)
    if (newIdx !== stepIndex) { stepIndex = newIdx; parseStep.value = parseSteps[stepIndex] }
  }, 1000)
  try {
    const result = await parseResume(resumeText.value)
    if (result.error) { parseError.value = result.error; return }
    if (result.parseError) { parseError.value = result.parseError; return }
    if (result.name) form.value.name = result.name
    if (result.position) form.value.position = result.position
    if (result.yearsOfExperience) form.value.yearsOfExperience = result.yearsOfExperience
    if (result.techStack?.length) form.value.techStack = result.techStack
    if (result.projects?.length) form.value.projects = result.projects.map(p => ({ ...p, techUsed: ensureString(p.techUsed) }))
    if (result.education) form.value.education = { ...form.value.education, ...result.education }
    if (result.strengths?.length) form.value.strengths = ensureString(result.strengths)
    if (result.weaknesses?.length) form.value.weaknesses = ensureString(result.weaknesses)
  } catch (err) {
    parseError.value = err.name === 'AbortError' ? '请求超时' : '解析失败: ' + err.message
  } finally { clearInterval(parseTimer); isParsing.value = false }
}

// 保存
async function handleSave() {
  const data = { ...form.value }
  data.strengths = ensureArray(form.value.strengths)
  data.weaknesses = ensureArray(form.value.weaknesses)
  data.projects = data.projects.map(p => ({ ...p, techUsed: ensureArray(p.techUsed) }))
  await userStore.saveProfile(data)
  await loadProfile()
  isEditing.value = false
  alert('保存成功！')
}

function removeProject(index) { form.value.projects.splice(index, 1) }
function addProject() { form.value.projects.push({ name: '', description: '', techUsed: '', duration: '' }) }

const catLabels = { language: '语言', framework: '框架/库', tool: '工具', platform: '平台', other: '其他' }
const lvlLabels = { proficient: '精通', familiar: '熟悉', learning: '学习中' }
</script>

<template>
  <div class="page">
    <div v-if="isLoading" class="loading-spinner">加载中...</div>

    <!-- ====== 展示模式 ====== -->
    <template v-else-if="hasProfile && !isEditing">
      <div class="page-title">
        📝 我的技术档案
        <button class="btn btn-primary btn-sm" @click="isEditing = true" style="margin-left:auto">✏️ 编辑档案</button>
      </div>

      <div class="card mb-4">
        <div class="profile-header">
          <div class="ph-avatar">👤</div>
          <div class="ph-info">
            <h3>{{ form.name || '未命名' }}</h3>
            <p>{{ form.position }} · {{ form.yearsOfExperience }}年经验</p>
            <p v-if="form.education.school" class="text-secondary">🎓 {{ form.education.degree }} · {{ form.education.major }} · {{ form.education.school }}</p>
          </div>
        </div>
      </div>

      <div class="card mb-4">
        <div class="card-header">💻 技术栈</div>
        <div v-if="form.techStack.length" class="skill-tags">
          <span v-for="(t, i) in form.techStack" :key="i" class="skill-tag">
            <span class="tag" :class="{ 'tag-green': t.level === 'proficient', 'tag-yellow': t.level === 'familiar' }">{{ t.name }}</span>
          </span>
        </div>
        <div v-else class="empty-state"><div class="empty-state-text">暂无技术栈</div></div>
      </div>

      <div class="card mb-4">
        <div class="card-header">📁 项目经验</div>
        <div v-if="form.projects.length">
          <div v-for="(p, i) in form.projects" :key="i" class="proj-item">
            <div class="proj-head">
              <strong>{{ p.name || '未命名项目' }}</strong>
              <span v-if="p.duration" class="text-secondary">{{ p.duration }}</span>
            </div>
            <p v-if="p.description">{{ p.description }}</p>
            <div v-if="p.techUsed" class="flex gap-2 mt-2">
              <span v-for="t in ensureArray(p.techUsed)" :key="t" class="tag">{{ t }}</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-state"><div class="empty-state-text">暂无项目经验</div></div>
      </div>

      <div v-if="form.strengths || form.weaknesses" class="card">
        <div class="card-header">🎯 自我评估</div>
        <div v-if="form.strengths" class="mb-2"><strong>优势：</strong>{{ form.strengths }}</div>
        <div v-if="form.weaknesses"><strong>待提升：</strong>{{ form.weaknesses }}</div>
      </div>

      <div class="mt-4 text-center">
        <router-link to="/" class="btn btn-primary">🏠 返回首页</router-link>
      </div>
    </template>

    <!-- ====== 新建模式 ====== -->
    <template v-else-if="!hasProfile && !isEditing">
      <div class="page-title">📝 创建技术档案</div>
      <div class="page-subtitle">首次使用请先创建档案，可上传简历自动解析或手动填写</div>
      <div class="text-center mt-6">
        <button class="btn btn-primary btn-lg" @click="isEditing = true">🚀 开始创建</button>
      </div>
    </template>

    <!-- ====== 编辑表单 ====== -->
    <template v-if="isEditing">
      <div class="page-title">
        {{ hasProfile ? '✏️ 编辑档案' : '📝 创建档案' }}
        <button v-if="hasProfile" class="btn btn-ghost btn-sm" @click="isEditing = false" style="margin-left:auto">取消编辑</button>
      </div>

      <!-- 简历解析 -->
      <div class="card mb-4">
        <div class="card-header">📄 简历解析</div>
        <div class="flex gap-3 mb-2 items-center">
          <label class="btn btn-secondary btn-sm" style="cursor:pointer">📁 上传简历 <input type="file" accept=".txt,.md,.json,.pdf" hidden @change="handleFileUpload" /></label>
          <span v-if="resumeFile" class="text-secondary" style="font-size:13px">{{ resumeFile.name }}</span>
          <span v-if="isExtractingPDF" class="text-secondary">⏳ 提取中...</span>
        </div>
        <textarea v-model="resumeText" class="form-textarea" rows="5" placeholder="或直接粘贴简历文本..."></textarea>
        <div class="mt-2">
          <div class="flex gap-2 items-center">
            <button class="btn btn-primary btn-sm" @click="handleParseResume" :disabled="isParsing || !resumeText.trim()">{{ isParsing ? '🤖 解析中...' : '🤖 智能解析' }}</button>
            <span class="form-hint">AI 自动提取技能、项目等信息</span>
          </div>
          <div v-if="isParsing" class="parse-progress mt-2">
            <div class="progress-bar"><div class="progress-fill" :style="{ width: parseProgress + '%' }"></div></div>
            <div class="progress-text">{{ parseStep }} <span style="color:var(--text-muted);font-weight:400;font-size:12px">({{ parseElapsed }}秒)</span></div>
          </div>
        </div>
        <div v-if="parseError" class="error-message mt-2">{{ parseError }}</div>
      </div>

      <!-- 基本信息 -->
      <div class="card mb-4">
        <div class="card-header">👤 基本信息</div>
        <div class="form-row">
          <div class="form-group flex-1"><label class="form-label">姓名/昵称</label><input v-model="form.name" class="form-input" /></div>
          <div class="form-group flex-1"><label class="form-label">目标岗位</label><input v-model="form.position" class="form-input" /></div>
          <div class="form-group" style="width:110px"><label class="form-label">年限</label><input v-model.number="form.yearsOfExperience" class="form-input" type="number" min="0" /></div>
        </div>
      </div>

      <!-- 学历 -->
      <div class="card mb-4">
        <div class="card-header">🎓 教育背景</div>
        <div class="form-row">
          <div class="form-group flex-1"><label class="form-label">学位</label><select v-model="form.education.degree" class="form-select"><option value="">请选择</option><option>本科</option><option>硕士</option><option>博士</option><option>大专</option></select></div>
          <div class="form-group flex-1"><label class="form-label">专业</label><input v-model="form.education.major" class="form-input" /></div>
          <div class="form-group flex-1"><label class="form-label">学校</label><input v-model="form.education.school" class="form-input" /></div>
        </div>
      </div>

      <!-- 技术栈 -->
      <div class="card mb-4">
        <div class="card-header">💻 技术栈</div>
        <div class="skill-tags mb-2">
          <span v-for="(s, i) in form.techStack" :key="i" class="skill-tag">
            <span class="tag" :class="{ 'tag-green': s.level === 'proficient', 'tag-yellow': s.level === 'familiar' }">{{ s.name }} · {{ lvlLabels[s.level] }}</span>
            <button class="btn btn-ghost btn-sm" @click="removeSkill(i)" style="padding:0 4px">✕</button>
          </span>
        </div>
        <div class="flex gap-2 items-center">
          <input v-model="newSkillName" class="form-input" style="width:140px" placeholder="技能名" @keyup.enter="addSkill" />
          <select v-model="newSkillCategory" class="form-select" style="width:100px"><option v-for="(l,k) in catLabels" :key="k" :value="k">{{ l }}</option></select>
          <select v-model="newSkillLevel" class="form-select" style="width:80px"><option v-for="(l,k) in lvlLabels" :key="k" :value="k">{{ l }}</option></select>
          <button class="btn btn-secondary btn-sm" @click="addSkill">添加</button>
        </div>
      </div>

      <!-- 项目 -->
      <div class="card mb-4">
        <div class="card-header"><span>📁 项目经验</span><button class="btn btn-secondary btn-sm" @click="addProject" style="margin-left:auto">+ 添加</button></div>
        <div v-for="(proj, idx) in form.projects" :key="idx" class="project-item">
          <div class="flex justify-between mb-2"><span style="font-weight:600">项目 {{ idx+1 }}</span><button class="btn btn-ghost btn-sm" @click="removeProject(idx)">删除</button></div>
          <div class="form-row"><div class="form-group flex-1"><label class="form-label">名称</label><input v-model="proj.name" class="form-input" /></div><div class="form-group" style="width:150px"><label class="form-label">时间</label><input v-model="proj.duration" class="form-input" /></div></div>
          <div class="form-group"><label class="form-label">描述</label><textarea v-model="proj.description" class="form-textarea" rows="2"></textarea></div>
          <div class="form-group"><label class="form-label">技术（逗号分隔）</label><input v-model="proj.techUsed" class="form-input" /></div>
        </div>
      </div>

      <!-- 评估 -->
      <div class="card mb-4">
        <div class="card-header">🎯 自我评估</div>
        <div class="form-row">
          <div class="form-group flex-1"><label class="form-label">优势（逗号分隔）</label><input v-model="form.strengths" class="form-input" /></div>
          <div class="form-group flex-1"><label class="form-label">待提升（逗号分隔）</label><input v-model="form.weaknesses" class="form-input" /></div>
        </div>
      </div>

      <div class="flex gap-2 mb-6">
        <button class="btn btn-primary btn-lg" @click="handleSave">💾 保存档案</button>
        <button v-if="!hasProfile" class="btn btn-secondary btn-lg" @click="router.push('/')">取消</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.form-row { display: flex; gap: 16px; }
.skill-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.skill-tag { display: flex; align-items: center; gap: 2px; }
.project-item { border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; margin-bottom: 12px; }

.profile-header { display: flex; align-items: center; gap: 20px; }
.ph-avatar { width: 64px; height: 64px; border-radius: 50%; background: var(--accent-bg); display: flex; align-items: center; justify-content: center; font-size: 32px; }
.ph-info h3 { font-size: 20px; margin-bottom: 4px; }

.proj-item { padding: 12px 16px; border: 1px solid var(--border-color); border-radius: var(--radius-md); margin-bottom: 10px; }
.proj-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }

.parse-progress { padding: 12px 16px; background: var(--accent-bg); border-radius: var(--radius-md); border: 1px solid var(--accent-color); }
.progress-bar { height: 6px; background: var(--bg-hover); border-radius: 3px; overflow: hidden; margin-bottom: 8px; }
.progress-fill { height: 100%; width: 0%; background: linear-gradient(90deg, var(--accent-color), #818cf8); border-radius: 3px; transition: width .8s ease-out; }
.progress-text { font-size: 13px; color: var(--accent-color); font-weight: 500; text-align: center; }
</style>
