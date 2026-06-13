<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSettingsStore } from '@/stores/settings.js'
import { useThemeStore } from '@/stores/theme.js'
import { getCurrentUser, signOut } from '@/services/auth.js'

const settingsStore = useSettingsStore()
const themeStore = useThemeStore()
const router = useRouter()
const route = useRoute()
const userEmail = ref('')
const sidebarCollapsed = ref(false)

// 登录页全屏，不显示侧边栏
const hideSidebar = computed(() => route.meta?.hideSidebar === true)

onMounted(async () => {
  const user = await getCurrentUser()
  userEmail.value = user?.email || ''
})

async function handleLogout() {
  await signOut()
  router.push('/auth')
}
</script>

<template>
  <!-- 登录页：全屏无侧边栏 -->
  <div v-if="hideSidebar" class="app-container">
    <router-view />
  </div>

  <!-- 正常页面：带侧边栏 -->
  <div v-else class="app-container">
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-brand">
        <template v-if="!sidebarCollapsed">
          <svg class="brand-logo" viewBox="0 0 28 28" fill="none" width="24" height="24">
            <rect x="2" y="2" width="24" height="24" rx="6" stroke="currentColor" stroke-width="1.8"/>
            <path d="M8 12l4 4 8-8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <div class="brand-text-group">
            <span class="brand-text">JobPrep</span>
            <span class="brand-sub">AI Interview</span>
          </div>
        </template>
        <button class="collapse-btn" @click="sidebarCollapsed = !sidebarCollapsed" title="折叠侧栏">
          <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
            <path d="M12 5l-5 5 5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M17 5l-5 5 5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-group">
          <router-link to="/" class="nav-item" active-class="nav-item--active">
            <svg class="nav-ico" viewBox="0 0 20 20" fill="none" width="18" height="18"><path d="M3 8l7-5 7 5v9a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
            <span v-if="!sidebarCollapsed">首页</span>
          </router-link>
          <router-link to="/setup" class="nav-item" active-class="nav-item--active">
            <svg class="nav-ico" viewBox="0 0 20 20" fill="none" width="18" height="18"><circle cx="10" cy="8" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M4 18c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            <span v-if="!sidebarCollapsed">我的档案</span>
          </router-link>
          <router-link to="/history" class="nav-item" active-class="nav-item--active">
            <svg class="nav-ico" viewBox="0 0 20 20" fill="none" width="18" height="18"><rect x="3" y="4" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M7 9h6M7 13h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            <span v-if="!sidebarCollapsed">面试历史</span>
          </router-link>
        </div>
        <div class="nav-group">
          <router-link to="/company" class="nav-item" active-class="nav-item--active">
            <svg class="nav-ico" viewBox="0 0 20 20" fill="none" width="18" height="18"><rect x="3" y="7" width="6" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="11" y="3" width="6" height="14" rx="1" stroke="currentColor" stroke-width="1.5"/></svg>
            <span v-if="!sidebarCollapsed">公司题库</span>
          </router-link>
          <router-link to="/stats" class="nav-item" active-class="nav-item--active">
            <svg class="nav-ico" viewBox="0 0 20 20" fill="none" width="18" height="18"><path d="M3 17V9l4-2v10M9 17V7l4 2v8M15 17V5l2 1v11" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
            <span v-if="!sidebarCollapsed">面试统计</span>
          </router-link>
        </div>
        <div class="nav-group">
          <router-link to="/settings" class="nav-item" active-class="nav-item--active">
            <svg class="nav-ico" viewBox="0 0 20 20" fill="none" width="18" height="18"><circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M10 2v2m0 12v2m8-8h-2M4 10H2m13.07-5.07l-1.41 1.41M6.34 13.66l-1.41 1.41m12.14 0l-1.41-1.41M6.34 6.34L4.93 4.93" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            <span v-if="!sidebarCollapsed">设置</span>
            <span v-if="!settingsStore.currentConfig && !sidebarCollapsed" class="nav-warn"></span>
          </router-link>
        </div>
      </nav>
      <div class="sidebar-footer">
        <div v-if="userEmail && !sidebarCollapsed" class="user-info" :title="userEmail">
          <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><circle cx="8" cy="6" r="3" stroke="currentColor" stroke-width="1.3"/><path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          {{ userEmail.split('@')[0] }}
        </div>
        <button class="sidebar-btn" @click="themeStore.toggle" title="切换主题">
          {{ themeStore.theme === 'light' ? '🌙' : '☀️' }}
        </button>
        <button class="sidebar-btn" @click="handleLogout" title="退出">
          <svg viewBox="0 0 16 16" fill="none" width="15" height="15"><path d="M6 3H3v10h3M11 8H6m3-3l3 3-3 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </aside>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  background: var(--bg-primary);
}

/* === 侧边栏 === */
.sidebar {
  width: 220px;
  background: var(--surface-sidebar);
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  border-right: 1px solid var(--border-light);
  box-shadow: 1px 0 8px rgba(0,0,0,0.03);
  transition: width .2s ease, background .3s, color .3s;
  position: relative;
  z-index: 2;
}
.sidebar.collapsed {
  width: 60px;
}

.sidebar-brand {
  padding: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.collapsed .sidebar-brand { justify-content: center; padding: 14px 10px; }
.collapse-btn {
  width: 34px; height: 34px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--border-light);
  border-radius: 9px;
  background: transparent;
  cursor: pointer;
  color: var(--text-secondary);
  flex-shrink: 0;
  transition: all .15s;
}
.collapse-btn:hover { background: var(--surface-hover); color: var(--text-primary); border-color: var(--border-medium); }
.collapsed .collapse-btn svg { transform: scaleX(-1); }

.brand-logo {
  color: var(--color-primary);
  flex-shrink: 0;
}

.brand-text-group {
  display: flex; flex-direction: column; gap: 1px;
  overflow: hidden; white-space: nowrap; flex: 1;
}

.brand-text {
  font-size: 16px; font-weight: 680; color: var(--text-primary);
  letter-spacing: -.02em; line-height: 1.3;
}
.brand-sub {
  font-size: 11px; color: var(--text-muted); letter-spacing: .04em;
  font-weight: 500;
}

/* === 导航 === */
.sidebar-nav {
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.nav-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.nav-group + .nav-group {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border-light);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 10px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14.5px;
  font-weight: 500;
  transition: color .12s, background .12s;
  letter-spacing: .01em;
}

.nav-item:hover {
  color: var(--text-primary);
  background: var(--surface-hover);
}

.nav-item--active {
  color: var(--text-primary);
  background: var(--color-primary-bg);
  font-weight: 560;
}

.nav-ico { flex-shrink: 0; }
.collapsed .nav-item { justify-content: center; padding: 10px; }
.nav-warn { margin-left: auto; width: 7px; height: 7px; border-radius: 50%; background: var(--accent-color); }

/* === 底部 === */
.sidebar-footer {
  margin-top: auto;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-top: 1px solid var(--border-light);
}

.user-info {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-btn {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--border-light);
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  font-size: 15px;
  color: var(--text-secondary);
  transition: all .12s;
}
.sidebar-btn:hover { background: var(--surface-hover); color: var(--text-primary); }

/* === 主区域 === */
.main-content {
  flex: 1;
  overflow-y: auto;
  background: var(--bg-primary);
}
</style>
