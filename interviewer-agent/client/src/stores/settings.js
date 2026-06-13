import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as data from '@/services/data.js'

export const useSettingsStore = defineStore('settings', () => {
  const modelConfigs = ref([])
  const currentConfigId = ref(localStorage.getItem('currentModelConfigId') || null)
  const reviewMode = ref(localStorage.getItem('reviewMode') || 'instant')

  const currentConfig = computed(() => {
    return modelConfigs.value.find(c => String(c.id) === String(currentConfigId.value))
      || modelConfigs.value[0]
      || null
  })

  async function loadConfigs() {
    try {
      modelConfigs.value = await data.getModelConfigs()
      // 同时存 localStorage 给 api.js 备用
      localStorage.setItem('modelConfigs', JSON.stringify(modelConfigs.value))
    } catch (e) {
      console.warn('加载模型配置失败:', e.message)
    }
  }

  async function saveConfig(config) {
    try {
      const saved = await data.saveModelConfig(config)
      if (!saved) throw new Error('保存失败')
      await loadConfigs()
      if (modelConfigs.value.length === 1) {
        setCurrentConfig(saved.id)
      }
    } catch (e) {
      console.error('保存模型配置失败:', e.message)
      throw e
    }
  }

  async function deleteConfig(id) {
    await data.deleteModelConfig(id)
    if (currentConfigId.value === String(id)) {
      const next = modelConfigs.value.find(c => String(c.id) !== String(id))
      currentConfigId.value = next ? String(next.id) : null
      if (currentConfigId.value) {
        localStorage.setItem('currentModelConfigId', currentConfigId.value)
      } else {
        localStorage.removeItem('currentModelConfigId')
      }
    }
    await loadConfigs()
  }

  function setCurrentConfig(id) {
    currentConfigId.value = String(id)
    localStorage.setItem('currentModelConfigId', String(id))
  }

  function setReviewMode(mode) {
    reviewMode.value = mode
    localStorage.setItem('reviewMode', mode)
  }

  loadConfigs()

  return {
    modelConfigs, currentConfigId, currentConfig, reviewMode,
    loadConfigs, saveConfig, deleteConfig, setCurrentConfig, setReviewMode
  }
})
