<script setup>
import { ref, reactive } from 'vue'
import { useSettingsStore } from '@/stores/settings.js'
import { testConnection } from '@/services/api.js'

const settingsStore = useSettingsStore()
const showForm = ref(false)
const testResult = ref(null)
const isTesting = ref(false)
const edit = reactive({ id:'', name:'', providerType:'anthropic', endpoint:'', apiKey:'', modelName:'claude-sonnet-4-6', isDefault:false })

function openNew() { Object.assign(edit, { id:'', name:'', providerType:'anthropic', endpoint:'', apiKey:'', modelName:'claude-sonnet-4-6', isDefault:false }); showForm.value = true; testResult.value = null }
function openEdit(c) { Object.assign(edit, { ...c }); showForm.value = true; testResult.value = null }
async function handleTest() { isTesting.value = true; testResult.value = null; try { testResult.value = await testConnection({ ...edit }) } catch(e) { testResult.value = { success:false, error:e.message } } finally { isTesting.value = false } }
async function handleSave() { if(!edit.name||!edit.apiKey) return; await settingsStore.saveConfig({ ...edit }); showForm.value = false }
async function handleDelete(id) { if(confirm('删除？')) await settingsStore.deleteConfig(id) }
</script>

<template>
  <div class="page">
    <h1 class="h1">⚙️ 设置</h1>

    <div class="card">
      <div class="card-hd"><span>🔌 模型配置</span><button class="btn-sm pri" @click="openNew">+ 添加</button></div>
      <div v-if="!settingsStore.modelConfigs.length" class="empty">还没有模型配置，请先添加</div>
      <div v-else class="cfg-list">
        <div v-for="c in settingsStore.modelConfigs" :key="c.id" class="cfg" :class="{ cur: settingsStore.currentConfigId === c.id }">
          <div>
            <div class="cfg-name">{{ c.name }} <span v-if="c.isDefault" class="badge ok">默认</span></div>
            <div class="cfg-meta">{{ c.providerType === 'anthropic' ? 'Anthropic' : 'OpenAI' }} · {{ c.modelName }}</div>
          </div>
          <div class="cfg-acts">
            <button v-if="settingsStore.currentConfigId !== c.id" class="btn-sm" @click="settingsStore.setCurrentConfig(c.id)">使用</button>
            <button class="btn-sm" @click="openEdit(c)">编辑</button>
            <button class="btn-sm" @click="handleDelete(c.id)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showForm" class="card mt">
      <div class="card-hd">📝 {{ edit.id ? '编辑' : '新增' }}配置</div>
      <div class="fld"><label>名称</label><input v-model="edit.name" placeholder="我的Claude" /></div>
      <div class="fld"><label>提供商</label><select v-model="edit.providerType"><option value="anthropic">Anthropic</option><option value="openai-compatible">OpenAI兼容</option></select></div>
      <div class="fld"><label>API 端点</label><input v-model="edit.endpoint" placeholder="自定义端点，留空则默认" /></div>
      <div class="fld"><label>API Key</label><input v-model="edit.apiKey" type="password" /></div>
      <div class="fld"><label>模型名称</label><input v-model="edit.modelName" placeholder="claude-sonnet-4-6" /></div>
      <div class="fld"><label class="chk"><input type="checkbox" v-model="edit.isDefault" /> 设为默认</label></div>
      <div v-if="testResult" :class="testResult.success ? 'ok' : 'err'">{{ testResult.success ? '✅ 连接成功' : '❌ '+ (testResult.error||'失败') }}</div>
      <div class="fld-acts"><button class="btn-sm" @click="handleTest" :disabled="isTesting">测试连接</button><button class="btn-sm pri" @click="handleSave">保存</button><button class="btn-sm" @click="showForm=false">取消</button></div>
    </div>

    <div class="card mt">
      <div class="card-hd">📋 面试偏好</div>
      <div class="fld"><label>评审模式</label><select v-model="settingsStore.reviewMode" @change="settingsStore.setReviewMode(settingsStore.reviewMode)"><option value="instant">即时点评</option><option value="summary">整体总结</option></select></div>
    </div>
  </div>
</template>

<style scoped>
.page { max-width: 680px; margin: 0 auto; padding: 48px 32px; }
.h1 { font-size: 24px; font-weight: 800; margin-bottom: 28px; }
.card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 28px; margin-bottom: 0; }
.card-hd { display: flex; justify-content: space-between; align-items: center; font-size: 15px; font-weight: 700; margin-bottom: 20px; }
.mt { margin-top: 20px; }
.empty { text-align: center; color: var(--text-muted); padding: 28px 0; font-size: 14px; }

.cfg-list { display: flex; flex-direction: column; gap: 8px; }
.cfg { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border: 1px solid var(--border-color); border-radius: 12px; }
.cfg.cur { border-color: var(--accent-color); background: var(--accent-bg); }
.cfg-name { font-weight: 600; font-size: 14px; } .cfg-name .badge { font-size: 11px; padding: 1px 6px; border-radius: 6px; font-weight: 600; } .badge.ok { background: #ecfdf5; color: #065f46; }
.cfg-meta { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
.cfg-acts { display: flex; gap: 6px; }

.fld { margin-bottom: 14px; }
.fld label { display: block; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 5px; }
.fld input, .fld select { width: 100%; padding: 9px 13px; border: 1.5px solid var(--border-color); border-radius: 10px; font-size: 14px; font-family: inherit; background: var(--bg-primary); color: var(--text-primary); }
.fld input:focus, .fld select:focus { border-color: var(--accent-color); box-shadow: 0 0 0 3px rgba(79,70,229,.08); outline: none; }
.chk { display: flex !important; align-items: center; gap: 8px; cursor: pointer; font-size: 14px !important; }
.chk input { width: auto; }
.fld-acts { display: flex; gap: 8px; margin-top: 16px; }
.ok, .err { padding: 10px 14px; border-radius: 10px; font-size: 13px; margin-bottom: 14px; }
.ok { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
.err { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

.btn-sm { padding: 6px 14px; border: 1.5px solid var(--border-color); border-radius: 9px; background: none; font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; color: var(--text-primary); }
.btn-sm:hover { background: var(--bg-hover); }
.btn-sm.pri { background: var(--accent-color); border-color: var(--accent-color); color: #fff; }
.btn-sm.pri:hover { background: #4338ca; }
</style>
