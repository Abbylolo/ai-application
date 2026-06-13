<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user.js'
import { useSettingsStore } from '@/stores/settings.js'
import { parseResume } from '@/services/api.js'

const router = useRouter()
const userStore = useUserStore()
const settingsStore = useSettingsStore()

const isParsing = ref(false)
const parseError = ref('')
const resumeText = ref('')
const resumeFile = ref(null)

const form = ref({
  name: '',
  position: '',
  yearsOfExperience: 0,
  techStack: [],
  projects: [],
  education: { degree: '', major: '', school: '' },
  strengths: '',
  weaknesses: '',
  resumeRaw: ''
})

// 数组 ↔ 逗号分隔字符串的辅助函数
function ensureArray(val) {
  if (Array.isArray(val)) return val
  if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean)
  return []
}
function ensureString(val) {
  if (Array.isArray(val)) return val.join(', ')
  return val || ''
}

// 加载当前 profile（如有）
onMounted(() => {
  if (userStore.currentProfile) {
    const p = userStore.currentProfile
    form.value = {
      ...p,
      strengths: ensureString(p.strengths),
      weaknesses: ensureString(p.weaknesses),
      projects: (p.projects || []).map(proj => ({
        ...proj,
        techUsed: ensureString(proj.techUsed)
      }))
    }
  }
})

// 新技能输入
const newSkillName = ref('')
const newSkillCategory = ref('framework')
const newSkillLevel = ref('proficient')

function addSkill() {
  if (!newSkillName.value.trim()) return
  form.value.techStack.push({
    name: newSkillName.value.trim(),
    category: newSkillCategory.value,
    level: newSkillLevel.value
  })
  newSkillName.value = ''
}

function removeSkill(index) {
  form.value.techStack.splice(index, 1)
}

// 简历上传
const isExtractingPDF = ref(false)

async function handleFileUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  resumeFile.value = file
  parseError.value = ''

  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    // PDF 文件：用 pdf.js 提取文本
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
        const pageText = content.items.map(item => item.str).join(' ')
        fullText += pageText + '\n'
      }

      resumeText.value = fullText
      form.value.resumeRaw = fullText
      parseError.value = ''
    } catch (err) {
      console.error('PDF解析失败:', err)
      parseError.value = 'PDF 解析失败，请尝试复制文本内容粘贴到下方文本框'
    } finally {
      isExtractingPDF.value = false
    }
  } else {
    // 纯文本文件
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target.result
      resumeText.value = text
      form.value.resumeRaw = text
    }
    reader.readAsText(file)
  }
}

async function handleParseResume() {
  console.log('🔍 handleParseResume 开始')
  if (!resumeText.value.trim()) {
    parseError.value = '请先上传简历文件或粘贴简历文本'
    return
  }
  if (!settingsStore.currentConfig) {
    parseError.value = '请先在设置中配置模型'
    return
  }

  console.log('📤 发送解析请求, 配置:', settingsStore.currentConfig?.modelName)
  isParsing.value = true
  parseError.value = ''

  try {
    const result = await parseResume(resumeText.value)
    console.log('📥 解析返回:', result)

    if (result.error) {
      parseError.value = result.error
      return
    }

    if (result.parseError) {
      console.log('LLM原始返回:', result.rawContent)
      console.log('清洗后:', result.cleanedContent)
      parseError.value = result.parseError
      return
    }

    // 填充表单
    if (result.name) form.value.name = result.name
    if (result.position) form.value.position = result.position
    if (result.yearsOfExperience) form.value.yearsOfExperience = result.yearsOfExperience
    if (result.techStack?.length) form.value.techStack = result.techStack
    if (result.projects?.length) form.value.projects = result.projects
    if (result.education) form.value.education = { ...form.value.education, ...result.education }
    if (result.strengths?.length) form.value.strengths = ensureString(result.strengths)
    if (result.weaknesses?.length) form.value.weaknesses = ensureString(result.weaknesses)
    console.log('✅ 解析完成')
  } catch (err) {
    console.error('❌ 解析异常:', err.name, err.message)
    if (err.name === 'AbortError') {
      parseError.value = '解析请求超时（2分钟）。可能原因：模型响应慢或网络问题，请检查模型配置后重试'
    } else {
      parseError.value = '解析失败：' + (err.message || '未知错误')
    }
  } finally {
    isParsing.value = false
  }
}

async function handleSave() {
  const data = { ...form.value }
  // 转换逗号分隔字符串为数组
  data.strengths = ensureArray(form.value.strengths)
  data.weaknesses = ensureArray(form.value.weaknesses)
  // 确保 projects 中的 techUsed 是数组
  data.projects = data.projects.map(p => ({
    ...p,
    techUsed: ensureArray(p.techUsed)
  }))
  data.updatedAt = new Date()
  await userStore.saveProfile(data)
  alert('保存成功！')
  router.push('/')
}

// 删除项目
function removeProject(index) {
  form.value.projects.splice(index, 1)
}

// 添加项目
function addProject() {
  form.value.projects.push({ name: '', description: '', techUsed: [], duration: '' })
}

const categoryLabels = { language: '语言', framework: '框架', tool: '工具', platform: '平台', other: '其他' }
const levelLabels = { proficient: '精通', familiar: '熟悉', learning: '学习中' }
</script>

<template>
  <div class="page">
    <div class="page-title">📝 {{ userStore.currentProfile ? '编辑档案' : '创建技术档案' }}</div>
    <div class="page-subtitle">上传简历自动解析，或手动填写</div>

    <!-- 简历上传区 -->
    <div class="card mb-4">
      <div class="card-header">📄 简历解析</div>
      <div class="flex gap-3 mb-2 items-center">
        <label class="btn btn-secondary btn-sm" style="cursor:pointer">
          📁 上传简历文件
          <input type="file" accept=".txt,.md,.json,.pdf" hidden @change="handleFileUpload" />
        </label>
        <span v-if="resumeFile" class="text-secondary" style="font-size:13px">
          {{ resumeFile.name }}
        </span>
        <span v-if="isExtractingPDF" class="text-secondary" style="font-size:12px">
          ⏳ 正在提取PDF文本...
        </span>
      </div>
      <textarea
        v-model="resumeText"
        class="form-textarea"
        rows="6"
        placeholder="或直接粘贴简历文本内容..."
      ></textarea>
      <div class="mt-2 flex gap-2 items-center">
        <button
          class="btn btn-primary btn-sm"
          @click="handleParseResume"
          :disabled="isParsing || !resumeText.trim()"
        >
          {{ isParsing ? '🤖 解析中...' : '🤖 智能解析' }}
        </button>
        <span class="form-hint">使用 AI 自动提取岗位、技能、项目等信息</span>
      </div>
      <div v-if="parseError" class="error-message mt-2">{{ parseError }}</div>
    </div>

    <!-- 基本信息 -->
    <div class="card mb-4">
      <div class="card-header">👤 基本信息</div>
      <div class="form-row">
        <div class="form-group flex-1">
          <label class="form-label">姓名/昵称</label>
          <input v-model="form.name" class="form-input" placeholder="如何称呼你" />
        </div>
        <div class="form-group flex-1">
          <label class="form-label">目标岗位</label>
          <input v-model="form.position" class="form-input" placeholder="如：前端开发工程师" />
        </div>
        <div class="form-group" style="width:120px">
          <label class="form-label">工作年限</label>
          <input v-model.number="form.yearsOfExperience" class="form-input" type="number" min="0" max="30" />
        </div>
      </div>
    </div>

    <!-- 学历 -->
    <div class="card mb-4">
      <div class="card-header">🎓 教育背景</div>
      <div class="form-row">
        <div class="form-group flex-1">
          <label class="form-label">学位</label>
          <select v-model="form.education.degree" class="form-select">
            <option value="">请选择</option>
            <option value="本科">本科</option>
            <option value="硕士">硕士</option>
            <option value="博士">博士</option>
            <option value="大专">大专</option>
            <option value="高中">高中及以下</option>
          </select>
        </div>
        <div class="form-group flex-1">
          <label class="form-label">专业</label>
          <input v-model="form.education.major" class="form-input" placeholder="如：计算机科学与技术" />
        </div>
        <div class="form-group flex-1">
          <label class="form-label">学校</label>
          <input v-model="form.education.school" class="form-input" placeholder="如：清华大学" />
        </div>
      </div>
    </div>

    <!-- 技术栈 -->
    <div class="card mb-4">
      <div class="card-header">💻 技术栈</div>
      <div class="skill-tags mb-2">
        <span v-for="(skill, idx) in form.techStack" :key="idx" class="skill-tag">
          <span class="tag" :class="{
            'tag-green': skill.level === 'proficient',
            'tag-yellow': skill.level === 'familiar',
          }">{{ skill.name }} · {{ levelLabels[skill.level] || skill.level }} · {{ categoryLabels[skill.category] || skill.category }}</span>
          <button class="btn btn-ghost btn-sm" @click="removeSkill(idx)" style="padding:0 4px;font-size:12px">✕</button>
        </span>
      </div>
      <div class="flex gap-2 items-center" style="flex-wrap:wrap">
        <input v-model="newSkillName" class="form-input" style="width:160px" placeholder="技能名" @keyup.enter="addSkill" />
        <select v-model="newSkillCategory" class="form-select" style="width:100px">
          <option v-for="(label, key) in categoryLabels" :key="key" :value="key">{{ label }}</option>
        </select>
        <select v-model="newSkillLevel" class="form-select" style="width:90px">
          <option v-for="(label, key) in levelLabels" :key="key" :value="key">{{ label }}</option>
        </select>
        <button class="btn btn-secondary btn-sm" @click="addSkill">添加</button>
      </div>
    </div>

    <!-- 项目经验 -->
    <div class="card mb-4">
      <div class="card-header">
        <span>📁 项目经验</span>
        <button class="btn btn-secondary btn-sm" @click="addProject" style="margin-left:auto">+ 添加项目</button>
      </div>
      <div v-for="(proj, idx) in form.projects" :key="idx" class="project-item">
        <div class="flex justify-between items-center mb-2">
          <span style="font-weight:600">项目 {{ idx + 1 }}</span>
          <button class="btn btn-ghost btn-sm" @click="removeProject(idx)">删除</button>
        </div>
        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">项目名称</label>
            <input v-model="proj.name" class="form-input" placeholder="项目名称" />
          </div>
          <div class="form-group" style="width:160px">
            <label class="form-label">时间段</label>
            <input v-model="proj.duration" class="form-input" placeholder="如 2023-2024" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">项目描述</label>
          <textarea v-model="proj.description" class="form-textarea" rows="2" placeholder="简述项目内容和你的角色"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">使用技术（逗号分隔）</label>
          <input v-model="proj.techUsed" class="form-input" placeholder="如 React, TypeScript, Node.js" />
        </div>
      </div>
      <div v-if="!form.projects.length" class="text-muted text-center" style="padding:16px">暂无项目，点击上方按钮添加</div>
    </div>

    <!-- 优势/待提升 -->
    <div class="card mb-4">
      <div class="card-header">🎯 自我评估</div>
      <div class="form-row">
        <div class="form-group flex-1">
          <label class="form-label">优势领域（逗号分隔）</label>
          <input v-model="form.strengths" class="form-input" placeholder="如 React源码理解, 工程化实践" />
        </div>
        <div class="form-group flex-1">
          <label class="form-label">待提升领域（逗号分隔）</label>
          <input v-model="form.weaknesses" class="form-input" placeholder="如 算法, 系统设计" />
        </div>
      </div>
    </div>

    <div class="flex gap-2">
      <button class="btn btn-primary btn-lg" @click="handleSave">💾 保存档案</button>
      <button class="btn btn-secondary btn-lg" @click="router.push('/')">取消</button>
    </div>
  </div>
</template>

<style scoped>
.form-row {
  display: flex; gap: 16px;
}
.skill-tags {
  display: flex; flex-wrap: wrap; gap: 6px;
}
.skill-tag {
  display: flex; align-items: center; gap: 2px;
}
.project-item {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 16px;
  margin-bottom: 12px;
}
</style>
