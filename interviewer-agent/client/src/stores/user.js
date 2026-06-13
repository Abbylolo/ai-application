import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import db from '@/db/database.js'

export const useUserStore = defineStore('user', () => {
  const profiles = ref([])
  const currentProfileId = ref(localStorage.getItem('currentProfileId') || null)

  const currentProfile = computed(() => {
    return profiles.value.find(p => p.id === currentProfileId.value) || null
  })

  async function loadProfiles() {
    profiles.value = await db.userProfiles.orderBy('updatedAt').reverse().toArray()
  }

  async function saveProfile(profile) {
    // 深拷贝去掉 Vue 响应式 Proxy，否则 IndexedDB 无法存储
    const plain = JSON.parse(JSON.stringify(profile))
    // 恢复 Date 对象（JSON序列化会丢失）
    if (plain.createdAt) plain.createdAt = new Date(plain.createdAt)
    plain.updatedAt = new Date()

    if (plain.id) {
      await db.userProfiles.update(Number(plain.id), plain)
    } else {
      plain.createdAt = new Date()
      const id = await db.userProfiles.add(plain)
      plain.id = Number(id)
    }

    await loadProfiles()

    // 自动设为当前
    if (!currentProfileId.value) {
      setCurrentProfile(profile.id)
    }
  }

  async function deleteProfile(id) {
    await db.userProfiles.delete(id)
    if (currentProfileId.value === id) {
      currentProfileId.value = profiles.value[0]?.id || null
      if (currentProfileId.value) {
        localStorage.setItem('currentProfileId', currentProfileId.value)
      } else {
        localStorage.removeItem('currentProfileId')
      }
    }
    await loadProfiles()
  }

  function setCurrentProfile(id) {
    currentProfileId.value = id
    localStorage.setItem('currentProfileId', id)
  }

  // 技能分类统计
  const skillCategories = computed(() => {
    const profile = currentProfile.value
    if (!profile?.techStack) return {}
    const cats = {}
    for (const tech of profile.techStack) {
      const cat = tech.category || 'other'
      if (!cats[cat]) cats[cat] = []
      cats[cat].push(tech)
    }
    return cats
  })

  loadProfiles()

  return {
    profiles,
    currentProfileId,
    currentProfile,
    skillCategories,
    loadProfiles,
    saveProfile,
    deleteProfile,
    setCurrentProfile
  }
})
