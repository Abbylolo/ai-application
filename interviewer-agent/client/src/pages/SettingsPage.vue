<script setup>
import { ref, reactive } from 'vue'
import { useSettingsStore } from '@/stores/settings.js'
import { testConnection } from '@/services/api.js'

const settingsStore = useSettingsStore()

const showForm = ref(false)
const testResult = ref(null)
const isTesting = ref(false)
const editConfig = reactive({
  id: '',
  name: '',
  providerType: 'anthropic',
  endpoint: '',
  apiKey: '',
  modelName: 'claude-sonnet-4-6',
  isDefault: false
})

function openNew() {
  Object.assign(editConfig, { id: '', name: '', providerType: 'anthropic', endpoint: '', apiKey: '', modelName: 'claude-sonnet-4-6', isDefault: false })
  showForm.value = true
  testResult.value = null
}

function openEdit(config) {
  Object.assign(editConfig, { ...config })
  showForm.value = true
  testResult.value = null
}

async function handleTest() {
  isTesting.value = true
  testResult.value = null
  try {
    const result = await testConnection({
      providerType: editConfig.providerType,
      apiKey: editConfig.apiKey,
      endpoint: editConfig.endpoint,
      modelName: editConfig.modelName
    })
    testResult.value = result
  } catch (err) {
    testResult.value = { success: false, error: err.message }
  } finally {
    isTesting.value = false
  }
}

async function handleSave() {
  if (!editConfig.name || !editConfig.apiKey) return
  await settingsStore.saveConfig({ ...editConfig })
  showForm.value = false
}

async function handleDelete(id) {
  if (confirm('确定删除这个模型配置？')) {
    await settingsStore.deleteConfig(id)
  }
}

function handleSelect(id) {
  settingsStore.setCurrentConfig(id)
}
</script>

<template>
  <div class="page">
    <div class="page-title">⚙️ 设置</div>

    <!-- 模型配置 -->
    <div class="card mb-4">
      <div class="card-header">
        <span>🔌 模型配置</span>
        <button class="btn btn-primary btn-sm" @click="openNew" style="margin-left:auto">+ 添加配置</button>
      </div>

      <div v-if="!settingsStore.modelConfigs.length" class="empty-state">
        <div class="empty-state-icon">🔌</div>
        <div class="empty-state-text">还没有配置模型，请先添加</div>
        <button class="btn btn-primary" @click="openNew">添加模型配置</button>
      </div>

      <div v-else class="config-list">
        <div
          v-for="config in settingsStore.modelConfigs"
          :key="config.id"
          class="config-item"
          :class="{ 'config-item--active': settingsStore.currentConfigId === config.id }"
        >
          <div class="config-info">
            <div class="config-name">
              {{ config.name }}
              <span v-if="config.isDefault" class="tag tag-green">默认</span>
              <span v-if="settingsStore.currentConfigId === config.id" class="tag">当前使用</span>
            </div>
            <div class="config-detail text-secondary">
              {{ config.providerType === 'anthropic' ? 'Anthropic' : 'OpenAI兼容' }} · {{ config.modelName }}
              <span v-if="config.endpoint"> · {{ config.endpoint }}</span>
            </div>
          </div>
          <div class="config-actions">
            <button class="btn btn-sm btn-secondary" @click="openEdit(config)">编辑</button>
            <button
              v-if="settingsStore.currentConfigId !== config.id"
              class="btn btn-sm btn-primary"
              @click="handleSelect(config.id)"
            >使用</button>
            <button class="btn btn-sm btn-ghost" @click="handleDelete(config.id)">删除</button>
          </div>
        </div>
      </div>

      <!-- 添加/编辑表单 -->
      <div v-if="showForm" class="config-form mt-4">
        <div class="card-header">📝 {{ editConfig.id ? '编辑配置' : '新增配置' }}</div>

        <div class="form-group">
          <label class="form-label">配置名称 *</label>
          <input v-model="editConfig.name" class="form-input" placeholder="如：我的Claude / DeepSeek" />
        </div>

        <div class="form-group">
          <label class="form-label">提供商类型</label>
          <select v-model="editConfig.providerType" class="form-select">
            <option value="anthropic">Anthropic（原生）</option>
            <option value="openai-compatible">OpenAI 兼容（DeepSeek/通义千问/Ollama...）</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">API 端点（可选，自定义API地址时填写）</label>
          <input v-model="editConfig.endpoint" class="form-input" placeholder="留空用官方地址。如 DeepSeek Anthropic兼容: https://api.deepseek.com" />
          <div class="form-hint">
            Anthropic 留空默认连 api.anthropic.com<br/>
            OpenAI兼容留空默认连 api.openai.com<br/>
            用 DeepSeek/通义千问 等请在下方选 OpenAI兼容 并填对应端点
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">API Key *</label>
          <input v-model="editConfig.apiKey" class="form-input" type="password" placeholder="sk-..." />
        </div>

        <div class="form-group">
          <label class="form-label">模型名称</label>
          <input v-model="editConfig.modelName" class="form-input" placeholder="claude-sonnet-4-6 / deepseek-chat" />
          <div class="form-hint">
            Anthropic 示例: claude-sonnet-4-6, claude-haiku-4-5<br/>
            OpenAI兼容示例: deepseek-chat, qwen-max, gpt-4o
          </div>
        </div>

        <div class="form-group">
          <label class="flex items-center gap-2" style="cursor:pointer">
            <input type="checkbox" v-model="editConfig.isDefault" />
            <span class="form-label" style="margin:0">设为默认配置</span>
          </label>
        </div>

        <!-- 测试结果 -->
        <div v-if="testResult" class="mb-4" :class="testResult.success ? 'success-message' : 'error-message'">
          <template v-if="testResult.success">
            ✅ 连接成功！模型回复：{{ testResult.content }}
          </template>
          <template v-else>
            ❌ 连接失败：{{ testResult.error || testResult.message }}
          </template>
        </div>

        <div class="flex gap-2">
          <button class="btn btn-secondary" @click="handleTest" :disabled="isTesting">
            {{ isTesting ? '测试中...' : '🔍 测试连接' }}
          </button>
          <button class="btn btn-primary" @click="handleSave" :disabled="!editConfig.name || !editConfig.apiKey">
            保存
          </button>
          <button class="btn btn-ghost" @click="showForm = false">取消</button>
        </div>
      </div>
    </div>

    <!-- 面试设置 -->
    <div class="card">
      <div class="card-header">📋 面试偏好</div>

      <div class="form-group">
        <label class="form-label">评审模式</label>
        <select v-model="settingsStore.reviewMode" class="form-select" @change="settingsStore.setReviewMode(settingsStore.reviewMode)">
          <option value="instant">即时点评（每题后给出标准答案+评分）</option>
          <option value="summary">整体总结（面试结束后统一总结）</option>
        </select>
      </div>
    </div>
  </div>
</template>

<style scoped>
.config-list { display: flex; flex-direction: column; gap: 8px; }
.config-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
  border: 1px solid var(--border-color); border-radius: var(--radius-md);
}
.config-item--active { border-color: var(--accent-color); background: var(--accent-bg); }
.config-name { font-weight: 600; display: flex; align-items: center; gap: 8px; }
.config-detail { font-size: 12px; margin-top: 2px; }
.config-actions { display: flex; gap: 6px; flex-shrink: 0; }
.config-form { border-top: 1px solid var(--border-color); padding-top: 16px; }
</style>
