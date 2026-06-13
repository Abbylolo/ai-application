import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import db from '@/db/database.js'

export const useSettingsStore = defineStore('settings', () => {
  const modelConfigs = ref([])
  const currentConfigId = ref(localStorage.getItem('currentModelConfigId') || null)
  const reviewMode = ref(localStorage.getItem('reviewMode') || 'instant')

  const currentConfig = computed(() => {
    return modelConfigs.value.find(c => c.id === currentConfigId.value) || modelConfigs.value[0] || null
  })

  async function loadConfigs() {
    modelConfigs.value = await db.modelConfigs.toArray()
    // 同步到 localStorage（供 api.js 非响应式获取）
    localStorage.setItem('modelConfigs', JSON.stringify(modelConfigs.value))
  }

  async function saveConfig(config) {
    config.updatedAt = new Date()
    // 确保 isDefault 是布尔值
    config.isDefault = !!config.isDefault

    if (config.id) {
      await db.modelConfigs.update(String(config.id), config)
    } else {
      config.id = Date.now().toString()
      config.createdAt = new Date()
      await db.modelConfigs.add(config)
    }

    // 如果标记为默认，取消其他默认
    if (config.isDefault) {
      try {
        // 先查出所有标记为默认的，逐个改（避免 where equals 在空值时崩溃）
        const all = await db.modelConfigs.toArray()
        for (const c of all) {
          if (c.id !== config.id && c.isDefault) {
            await db.modelConfigs.update(String(c.id), { isDefault: false })
          }
        }
      } catch (e) {
        console.warn('取消默认标记失败:', e)
      }
    }

    await loadConfigs()

    // 如果是第一个配置，自动设为当前
    if (modelConfigs.value.length === 1) {
      setCurrentConfig(String(config.id))
    }
  }

  async function deleteConfig(id) {
    await db.modelConfigs.delete(id)
    if (currentConfigId.value === id) {
      currentConfigId.value = modelConfigs.value[0]?.id || null
      if (currentConfigId.value) {
        localStorage.setItem('currentModelConfigId', currentConfigId.value)
      } else {
        localStorage.removeItem('currentModelConfigId')
      }
    }
    await loadConfigs()
  }

  function setCurrentConfig(id) {
    currentConfigId.value = id
    localStorage.setItem('currentModelConfigId', id)
  }

  function setReviewMode(mode) {
    reviewMode.value = mode
    localStorage.setItem('reviewMode', mode)
  }

  // 初始化加载
  loadConfigs()

  return {
    modelConfigs,
    currentConfigId,
    currentConfig,
    reviewMode,
    loadConfigs,
    saveConfig,
    deleteConfig,
    setCurrentConfig,
    setReviewMode
  }
})
