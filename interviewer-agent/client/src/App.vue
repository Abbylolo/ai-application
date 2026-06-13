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
    <aside class="sidebar">
      <div class="sidebar-brand">
        <svg class="brand-logo" viewBox="0 0 28 28" fill="none" width="28" height="28">
          <rect x="2" y="2" width="24" height="24" rx="6" stroke="currentColor" stroke-width="1.8"/>
          <path d="M8 12l4 4 8-8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div class="brand-text-group">
          <span class="brand-text">JobPrep</span>
          <span class="brand-sub">AI Interview</span>
        </div>
      </div>
      <nav class="sidebar-nav">
        <router-link to="/" class="nav-item" active-class="nav-item--active">
          <svg class="nav-ico" viewBox="0 0 20 20" fill="none" width="18" height="18"><path d="M3 8l7-5 7 5v9a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
          <span>首页</span>
        </router-link>
        <router-link to="/setup" class="nav-item" active-class="nav-item--active">
          <svg class="nav-ico" viewBox="0 0 20 20" fill="none" width="18" height="18"><circle cx="10" cy="8" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M4 18c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          <span>我的档案</span>
        </router-link>
        <router-link to="/history" class="nav-item" active-class="nav-item--active">
          <svg class="nav-ico" viewBox="0 0 20 20" fill="none" width="18" height="18"><rect x="3" y="4" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M7 9h6M7 13h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          <span>面试历史</span>
        </router-link>
        <router-link to="/company" class="nav-item" active-class="nav-item--active">
          <svg class="nav-ico" viewBox="0 0 20 20" fill="none" width="18" height="18"><rect x="3" y="7" width="6" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="11" y="3" width="6" height="14" rx="1" stroke="currentColor" stroke-width="1.5"/></svg>
          <span>公司题库</span>
        </router-link>
        <router-link to="/stats" class="nav-item" active-class="nav-item--active">
          <svg class="nav-ico" viewBox="0 0 20 20" fill="none" width="18" height="18"><path d="M3 17V9l4-2v10M9 17V7l4 2v8M15 17V5l2 1v11" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
          <span>面试统计</span>
        </router-link>
        <router-link to="/settings" class="nav-item" active-class="nav-item--active">
          <svg class="nav-ico" viewBox="0 0 20 20" fill="none" width="18" height="18"><circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M10 2v2m0 12v2m8-8h-2M4 10H2m13.07-5.07l-1.41 1.41M6.34 13.66l-1.41 1.41m12.14 0l-1.41-1.41M6.34 6.34L4.93 4.93" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          <span>设置</span>
          <span v-if="!settingsStore.currentConfig" class="nav-warn"></span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <div v-if="userEmail" class="user-info" :title="userEmail">
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
  background: var(--bg-sidebar, #fff4f0);
  color: var(--text-secondary, #8c6e6e);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  border-right: 1.5px solid var(--border-color, #f2ddd5);
  transition: background .3s, color .3s;
}

.sidebar-brand {
  padding: 22px 18px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-logo {
  color: var(--accent-color);
  flex-shrink: 0;
}

.brand-text-group { display: flex; flex-direction: column; gap: 0; }
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
  gap: 1px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 10px;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 500;
  transition: color .12s, background .12s;
  letter-spacing: .01em;
}

.nav-item:hover {
  color: var(--text-secondary);
  background: var(--bg-hover);
}

.nav-item--active {
  color: var(--text-primary);
  background: var(--accent-bg);
  font-weight: 560;
}

.nav-ico { flex-shrink: 0; }
.nav-warn { margin-left: auto; width: 7px; height: 7px; border-radius: 50%; background: var(--accent-color); }

/* === 底部 === */
.sidebar-footer {
  margin-top: auto;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-top: 1.5px solid var(--border-color);
}

.user-info {
  flex: 1;
  font-size: 12.5px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 7px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-btn {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border: 1.5px solid var(--border-color);
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  font-size: 15px;
  color: var(--text-muted);
  transition: all .12s;
}
.sidebar-btn:hover { background: var(--bg-hover); color: var(--text-secondary); }

/* === 主区域 === */
.main-content {
  flex: 1;
  overflow-y: auto;
  background: var(--bg-primary);
}
</style>
