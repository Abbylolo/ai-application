<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { parseJD, searchInterviewExperience } from '@/services/api.js'
import * as data from '@/services/data.js'

const router = useRouter()
const company = ref('')
const jdText = ref('')
const jdParsed = ref(null)
const searching = ref(false)
const parsing = ref(false)
const searchResults = ref([])
const records = ref([])

onMounted(async () => { records.value = await data.getCompanyQuestions() })

async function handleParse() { if(!jdText.value.trim()) return; parsing.value = true; try { const r = await parseJD(jdText.value); if(!r.error) jdParsed.value = r } catch(e){} finally { parsing.value = false } }
async function handleSearch() { if(!company.value.trim()) return; searching.value = true; try { const r = await searchInterviewExperience(company.value); searchResults.value = r.results || [] } catch(e){} finally { searching.value = false } }
function start() { if(!company.value.trim()) return; const q = { company: company.value.trim() }; if(jdParsed.value) q.jdInfo = encodeURIComponent(JSON.stringify(jdParsed.value)); router.push({ path: '/interview', query: q }) }
async function save() { if(!company.value.trim()) return; await data.saveCompanyQuestion({ companyName: company.value.trim(), position: jdParsed.value?.position || '', jdContent: jdText.value, source: 'user_upload', questions: [], tags: jdParsed.value?.requiredSkills || [] }); records.value = await data.getCompanyQuestions(); alert('已保存') }
</script>

<template>
  <div class="page">
    <h1 class="h1">🏢 公司面试</h1>

    <div class="card">
      <h3>🔍 目标公司</h3>
      <div class="fld"><label>公司名称</label><input v-model="company" placeholder="字节跳动 / 阿里巴巴 / 腾讯..." /></div>
      <div class="fld"><label>岗位描述 (JD) - 可选</label><textarea v-model="jdText" rows="4" placeholder="粘贴 JD 文本，AI 自动提取关键要求..."></textarea></div>
      <div class="acts"><button class="btn-sm pri" :disabled="!jdText.trim()||parsing" @click="handleParse">{{ parsing?'解析中...':'🤖 解析JD' }}</button><button class="btn-sm" :disabled="!company.trim()||searching" @click="handleSearch">{{ searching?'搜索中...':'🔍 搜索面经' }}</button></div>

      <div v-if="jdParsed" class="preview">
        <div v-if="jdParsed.position"><strong>{{ jdParsed.position }}</strong> · {{ jdParsed.level }}</div>
        <div class="tags" v-if="jdParsed.requiredSkills?.length"><span v-for="s in jdParsed.requiredSkills" :key="s" class="t">{{ s }}</span></div>
      </div>

      <div v-if="searchResults.length" class="results">
        <strong>搜索结果</strong>
        <div v-for="(r,i) in searchResults" :key="i" class="sr">{{ r.snippet }}</div>
      </div>

      <div class="acts mt">
        <button class="btn-lg pri" :disabled="!company.trim()" @click="start">🚀 开始 {{ company||'公司' }} 面试</button>
        <button v-if="jdParsed" class="btn-lg" @click="save">💾 保存记录</button>
      </div>
    </div>

    <div v-if="records.length" class="card">
      <h3>📁 已保存公司</h3>
      <div v-for="r in records" :key="r.id" class="row">
        <div><strong>{{ r.companyName }}</strong><span class="sub"> · {{ r.position || '未指定岗位' }}</span></div>
        <span class="t">{{ r.source === 'user_upload' ? '本人上传' : '搜索' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { max-width: 1080px; margin: 0 auto; padding: 56px 40px; }
.h1 { font-size: 28px; font-weight: 800; margin-bottom: 28px; }
.card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 28px; margin-bottom: 20px; }
.card h3 { font-size: 16px; font-weight: 700; margin: 0 0 18px; }

.fld { margin-bottom: 14px; }
.fld label { display: block; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 5px; }
.fld input, .fld textarea { width: 100%; padding: 9px 13px; border: 1.5px solid var(--border-color); border-radius: 10px; font-size: 14px; font-family: inherit; background: var(--bg-primary); color: var(--text-primary); resize: vertical; }
.fld input:focus, .fld textarea:focus { border-color: var(--accent-color); box-shadow: 0 0 0 3px rgba(79,70,229,.08); outline: none; }

.acts { display: flex; gap: 8px; flex-wrap: wrap; }
.mt { margin-top: 16px; }
.preview { margin-top: 16px; padding: 16px; background: var(--bg-hover); border-radius: 12px; font-size: 14px; }
.preview .tags { margin-top: 8px; display: flex; gap: 6px; flex-wrap: wrap; }
.results { margin-top: 16px; }
.sr { padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 13px; margin-top: 6px; color: var(--text-secondary); }

.row { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border: 1px solid var(--border-color); border-radius: 10px; margin-top: 8px; font-size: 14px; }
.sub { color: var(--text-muted); font-size: 12px; }

.t { font-size: 12px; padding: 2px 8px; border-radius: 9999px; background: var(--bg-hover); color: var(--text-secondary); font-weight: 500; }

.btn-sm { padding: 6px 14px; border: 1.5px solid var(--border-color); border-radius: 9px; background: none; font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; }
.btn-sm:hover { background: var(--bg-hover); }
.btn-sm:disabled { opacity: .4; cursor: not-allowed; }
.btn-sm.pri { background: var(--accent-color); border-color: var(--accent-color); color: #fff; }
.btn-lg { padding: 10px 22px; border: 1.5px solid var(--border-color); border-radius: 12px; background: none; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; }
.btn-lg:hover { background: var(--bg-hover); }
.btn-lg:disabled { opacity: .4; }
.btn-lg.pri { background: var(--accent-color); border-color: var(--accent-color); color: #fff; }
</style>
