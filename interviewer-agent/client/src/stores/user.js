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
    profile.updatedAt = new Date()

    if (profile.id) {
      await db.userProfiles.update(profile.id, profile)
    } else {
      profile.createdAt = new Date()
      const id = await db.userProfiles.add(profile)
      profile.id = id
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
