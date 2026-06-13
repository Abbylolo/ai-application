<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user.js'
import { useSettingsStore } from '@/stores/settings.js'
import { useInterviewStore } from '@/stores/interview.js'
import { parseJD, searchInterviewExperience } from '@/services/api.js'
import * as data from '@/services/data.js'

const router = useRouter()
const userStore = useUserStore()
const settingsStore = useSettingsStore()
const interviewStore = useInterviewStore()

const companyName = ref('')
const jdText = ref('')
const jdParsed = ref(null)
const isParsingJD = ref(false)
const searchResults = ref([])
const isSearching = ref(false)
const companyRecords = ref([])

onMounted(async () => {
  companyRecords.value = await data.getCompanyQuestions()
})

async function handleParseJD() {
  if (!jdText.value.trim()) return
  isParsingJD.value = true
  try {
    const result = await parseJD(jdText.value)
    if (!result.error) {
      jdParsed.value = result
    }
  } catch (err) {
    console.error('JD解析失败:', err)
  } finally {
    isParsingJD.value = false
  }
}

async function handleSearch() {
  if (!companyName.value.trim()) return
  isSearching.value = true
  try {
    const result = await searchInterviewExperience(companyName.value)
    searchResults.value = result.results || []
  } catch (err) {
    console.error('搜索失败:', err)
  } finally {
    isSearching.value = false
  }
}

async function startCompanyInterview() {
  if (!companyName.value.trim()) {
    alert('请输入公司名称')
    return
  }

  const query = { company: companyName.value.trim() }
  if (jdParsed.value) {
    query.jdInfo = encodeURIComponent(JSON.stringify(jdParsed.value))
  }

  router.push({ path: '/interview', query })
}

// 保存公司面经
async function saveCompanyRecord() {
  if (!companyName.value.trim()) return
  await data.saveCompanyQuestion({
    companyName: companyName.value.trim(),
    position: jdParsed.value?.position || '',
    jdContent: jdText.value,
    source: 'user_upload',
    questions: [],
    tags: jdParsed.value?.requiredSkills || []
  })
  alert('保存成功！')
  companyRecords.value = await data.getCompanyQuestions()
}
</script>

<template>
  <div class="page">
    <div class="page-title">🏢 公司特定面试</div>
    <div class="page-subtitle">针对目标公司，上传岗位描述，精准模拟面试</div>

    <!-- 公司选择 + JD上传 -->
    <div class="card mb-4">
      <div class="card-header">🔍 选择公司 & 上传岗位描述</div>

      <div class="form-group">
        <label class="form-label">公司名称 *</label>
        <input v-model="companyName" class="form-input" placeholder="如：字节跳动、阿里巴巴、腾讯..." />
      </div>

      <div class="form-group">
        <label class="form-label">岗位描述（JD）- 可选</label>
        <textarea
          v-model="jdText"
          class="form-textarea"
          rows="6"
          placeholder="粘贴岗位描述文本，AI 将自动提取关键要求..."
        ></textarea>
      </div>

      <div class="flex gap-2">
        <button
          class="btn btn-primary btn-sm"
          :disabled="!jdText.trim() || isParsingJD"
          @click="handleParseJD"
        >
          {{ isParsingJD ? '解析中...' : '🤖 解析JD' }}
        </button>
        <button
          class="btn btn-secondary btn-sm"
          :disabled="!companyName.trim() || isSearching"
          @click="handleSearch"
        >
          {{ isSearching ? '搜索中...' : '🔍 搜索面经' }}
        </button>
      </div>

      <!-- JD 解析结果 -->
      <div v-if="jdParsed" class="jd-preview mt-4">
        <div class="card-header">📋 岗位要求预览</div>
        <div v-if="jdParsed.position" class="mb-2"><strong>岗位：</strong>{{ jdParsed.position }} · {{ jdParsed.level }}</div>
        <div v-if="jdParsed.requiredSkills?.length" class="mb-2">
          <strong>必备技能：</strong>
          <span v-for="skill in jdParsed.requiredSkills" :key="skill" class="tag tag-green">{{ skill }}</span>
        </div>
        <div v-if="jdParsed.niceToHave?.length" class="mb-2">
          <strong>加分项：</strong>
          <span v-for="item in jdParsed.niceToHave" :key="item" class="tag">{{ item }}</span>
        </div>
        <div v-if="jdParsed.responsibilities?.length" class="mb-2">
          <strong>主要职责：</strong>
          <ul>
            <li v-for="r in jdParsed.responsibilities" :key="r">{{ r }}</li>
          </ul>
        </div>
      </div>

      <!-- 搜索面经结果 -->
      <div v-if="searchResults.length" class="mt-4">
        <div class="card-header">🔍 搜索结果</div>
        <div v-for="(item, idx) in searchResults" :key="idx" class="search-item">
          <div class="text-secondary" style="font-size:12px">{{ item.url }}</div>
          <div>{{ item.snippet }}</div>
        </div>
      </div>

      <div class="mt-4 flex gap-2">
        <button class="btn btn-primary btn-lg" @click="startCompanyInterview" :disabled="!companyName.trim()">
          🚀 开始 {{ companyName || '公司' }} 面试
        </button>
        <button v-if="jdParsed" class="btn btn-secondary btn-lg" @click="saveCompanyRecord">
          💾 保存记录
        </button>
      </div>
    </div>

    <!-- 历史公司记录 -->
    <div v-if="companyRecords.length" class="card">
      <div class="card-header">📁 已保存的公司记录</div>
      <div class="company-list">
        <div v-for="record in companyRecords" :key="record.id" class="company-item">
          <div class="flex-1">
            <div class="company-item-name">{{ record.companyName }}</div>
            <div v-if="record.position" class="text-secondary" style="font-size:12px">
              {{ record.position }}
              <span v-if="record.tags?.length"> · {{ record.tags.join(', ') }}</span>
            </div>
          </div>
          <span class="tag">{{ record.source === 'user_upload' ? '本人上传' : '网络检索' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.jd-preview {
  background: var(--bg-hover); border-radius: var(--radius-md); padding: 16px;
}
.jd-preview ul { padding-left: 20px; }

.search-item {
  padding: 8px 12px; border: 1px solid var(--border-color);
  border-radius: var(--radius-sm); margin-bottom: 8px;
}

.company-list { display: flex; flex-direction: column; gap: 8px; }
.company-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}
.company-item:hover { background: var(--bg-hover); }
.company-item-name { font-weight: 600; }
</style>
