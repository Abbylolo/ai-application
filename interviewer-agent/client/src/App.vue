<script setup>
import { useSettingsStore } from '@/stores/settings.js'
const settingsStore = useSettingsStore()
</script>

<template>
  <div class="app-container">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <span class="brand-icon">🤖</span>
        <span class="brand-text">面试官 Agent</span>
      </div>
      <nav class="sidebar-nav">
        <router-link to="/" class="nav-item" active-class="nav-item--active">
          <span class="nav-icon">🏠</span>
          <span>首页</span>
        </router-link>
        <router-link to="/setup" class="nav-item" active-class="nav-item--active">
          <span class="nav-icon">📝</span>
          <span>我的档案</span>
        </router-link>
        <router-link to="/history" class="nav-item" active-class="nav-item--active">
          <span class="nav-icon">📋</span>
          <span>面试历史</span>
        </router-link>
        <router-link to="/company" class="nav-item" active-class="nav-item--active">
          <span class="nav-icon">🏢</span>
          <span>公司题库</span>
        </router-link>
        <router-link to="/settings" class="nav-item" active-class="nav-item--active">
          <span class="nav-icon">⚙️</span>
          <span>设置</span>
          <span v-if="!settingsStore.currentConfig" class="nav-warn">⚠️</span>
        </router-link>
      </nav>
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

.sidebar {
  width: 200px;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-brand {
  padding: 20px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--border-color);
}

.brand-icon { font-size: 24px; }
.brand-text { font-size: 15px; font-weight: 700; color: var(--text-primary); }

.sidebar-nav {
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  transition: all 0.15s;
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item--active {
  background: var(--accent-bg);
  color: var(--accent-color);
  font-weight: 600;
}

.nav-icon { font-size: 16px; }
.nav-warn { font-size: 12px; margin-left: auto; }

.main-content {
  flex: 1;
  overflow-y: auto;
}
</style>
