import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as data from '@/services/data.js'

export const useUserStore = defineStore('user', () => {
  const profiles = ref([])
  const currentProfileId = ref(localStorage.getItem('currentProfileId') || null)

  const currentProfile = computed(() => {
    return profiles.value.find(p => String(p.id) === String(currentProfileId.value)) || null
  })

  async function loadProfiles() {
    try {
      const result = await data.getProfiles()
      profiles.value = result
      // 有数据但没选中时，自动选第一条
      if (result.length && !currentProfileId.value) {
        setCurrentProfile(result[0].id)
      }
    } catch (e) {
      console.error('加载档案失败:', e.message)
    }
  }

  async function saveProfile(profile) {
    try {
      const saved = await data.saveProfile(profile)
      await loadProfiles()
      if (!currentProfileId.value) {
        setCurrentProfile(saved.id)
      }
    } catch (e) {
      console.error('保存档案失败:', e.message)
      throw e
    }
  }

  async function deleteProfile(id) {
    await data.deleteProfile(id)
    if (String(currentProfileId.value) === String(id)) {
      currentProfileId.value = profiles.value[0]?.id ? String(profiles.value[0].id) : null
      if (currentProfileId.value) {
        localStorage.setItem('currentProfileId', currentProfileId.value)
      } else {
        localStorage.removeItem('currentProfileId')
      }
    }
    await loadProfiles()
  }

  function setCurrentProfile(id) {
    currentProfileId.value = String(id)
    localStorage.setItem('currentProfileId', String(id))
  }

  loadProfiles()

  return { profiles, currentProfileId, currentProfile, loadProfiles, saveProfile, deleteProfile, setCurrentProfile }
})
