<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { signIn, signUp } from '@/services/auth.js'

const router = useRouter()
const email = ref('')
const password = ref('')
const isRegister = ref(false)
const isLoading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')
const mounted = ref(false)

onMounted(() => { setTimeout(() => mounted.value = true, 50) })

async function handleSubmit() {
  errorMsg.value = ''
  successMsg.value = ''
  if (!email.value || !password.value) { errorMsg.value = '请填写邮箱和密码'; return }
  if (password.value.length < 6) { errorMsg.value = '密码至少6位'; return }

  isLoading.value = true
  try {
    if (isRegister.value) {
      const data = await signUp(email.value, password.value)
      if (data.user?.identities?.length === 0) {
        errorMsg.value = '该邮箱已注册，请直接登录'
      } else {
        successMsg.value = '注册成功！请点击下方链接切换登录'
      }
    } else {
      await signIn(email.value, password.value)
      router.push('/')
    }
  } catch (err) {
    errorMsg.value = err.message === 'Invalid login credentials' ? '邮箱或密码错误' : (err.message || '操作失败')
  } finally { isLoading.value = false }
}
</script>

<template>
  <div class="auth-shell">
    <!-- 背景装饰 -->
    <div class="bg-layer">
      <div class="bg-orb bg-orb--1"></div>
      <div class="bg-orb bg-orb--2"></div>
      <div class="bg-grid"></div>
    </div>

    <!-- 内容区 -->
    <div class="auth-content" :class="{ 'is-visible': mounted }">
      <!-- 品牌 -->
      <div class="brand-row">
        <div class="brand-mark">🤖</div>
        <h1 class="brand-name">面试官 Agent</h1>
        <p class="brand-tagline">AI 驱动的模拟技术面试平台</p>
      </div>

      <!-- 卡片 -->
      <div class="auth-card">
        <div class="card-tabs">
          <button
            class="tab-btn"
            :class="{ active: !isRegister }"
            @click="isRegister = false; errorMsg = ''; successMsg = ''"
          >登录</button>
          <button
            class="tab-btn"
            :class="{ active: isRegister }"
            @click="isRegister = true; errorMsg = ''; successMsg = ''"
          >注册</button>
          <div class="tab-indicator" :class="{ right: isRegister }"></div>
        </div>

        <div v-if="errorMsg" class="msg msg--error">
          <svg class="msg-icon" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M8 4.5v3.5M8 11h.007" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          {{ errorMsg }}
        </div>
        <div v-if="successMsg" class="msg msg--success">
          <svg class="msg-icon" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          {{ successMsg }}
        </div>

        <form @submit.prevent="handleSubmit" class="card-form">
          <div class="field">
            <label class="field-label">邮箱</label>
            <input v-model="email" type="email" class="field-input" placeholder="your@email.com" autocomplete="email" />
          </div>
          <div class="field">
            <label class="field-label">密码</label>
            <input v-model="password" type="password" class="field-input" placeholder="至少6位" minlength="6" autocomplete="current-password" />
          </div>
          <button type="submit" class="btn-submit" :disabled="isLoading">
            <span v-if="isLoading" class="spinner"></span>
            <span v-else>{{ isRegister ? '创建账号' : '登录' }}</span>
          </button>
        </form>
      </div>

      <!-- 底部 -->
      <p class="auth-footer">
        模拟大厂 / 中厂 / 小厂面试，覆盖主流技术八股文
      </p>
    </div>
  </div>
</template>

<style scoped>
/* ===== 字体 ===== */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

/* ===== 基础 ===== */
.auth-shell {
  min-height: 100vh;
  background: #09090b;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* ===== 背景层 ===== */
.bg-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.15;
}
.bg-orb--1 {
  width: 600px; height: 600px;
  background: #4f46e5;
  top: -200px; right: -100px;
  animation: orb-drift 20s ease-in-out infinite;
}
.bg-orb--2 {
  width: 400px; height: 400px;
  background: #6366f1;
  bottom: -150px; left: -80px;
  animation: orb-drift 25s ease-in-out infinite reverse;
}

@keyframes orb-drift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -20px) scale(1.05); }
  66% { transform: translate(-15px, 25px) scale(0.95); }
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 70%);
}

/* ===== 内容区 ===== */
.auth-content {
  position: relative;
  z-index: 1;
  width: 420px;
  padding: 24px;
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}
.auth-content.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* ===== 品牌 ===== */
.brand-row {
  text-align: center;
  margin-bottom: 32px;
}

.brand-mark {
  width: 56px; height: 56px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  box-shadow: 0 8px 32px rgba(79, 70, 229, 0.3);
  animation: float-mark 4s ease-in-out infinite;
}

@keyframes float-mark {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.brand-name {
  font-size: 22px;
  font-weight: 700;
  color: #fafafa;
  letter-spacing: -0.02em;
}

.brand-tagline {
  font-size: 14px;
  color: #71717a;
  margin-top: 6px;
}

/* ===== 卡片 ===== */
.auth-card {
  background: rgba(24, 24, 27, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  padding: 28px;
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  box-shadow: 0 1px 2px rgba(0,0,0,0.4), 0 20px 60px rgba(0,0,0,0.5);
}

/* ===== Tab切换 ===== */
.card-tabs {
  position: relative;
  display: flex;
  background: rgba(255,255,255,0.04);
  border-radius: 10px;
  padding: 3px;
  margin-bottom: 24px;
}

.tab-btn {
  flex: 1;
  padding: 8px;
  border: none;
  background: transparent;
  color: #71717a;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 8px;
  transition: color 0.2s;
  position: relative;
  z-index: 1;
  font-family: inherit;
}
.tab-btn.active {
  color: #fafafa;
}

.tab-indicator {
  position: absolute;
  top: 3px;
  left: 3px;
  width: calc(50% - 3px);
  height: calc(100% - 6px);
  background: rgba(255,255,255,0.08);
  border-radius: 8px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.tab-indicator.right {
  transform: translateX(100%);
}

/* ===== 消息 ===== */
.msg {
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: msg-in 0.3s ease;
}
@keyframes msg-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
.msg--error {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}
.msg--success {
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.2);
  color: #86efac;
}
.msg-icon {
  width: 16px; height: 16px;
  flex-shrink: 0;
}

/* ===== 表单 ===== */
.card-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field { }

.field-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #a1a1aa;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.field-input {
  width: 100%;
  padding: 10px 14px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  color: #fafafa;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
  box-sizing: border-box;
}
.field-input::placeholder {
  color: #52525b;
}
.field-input:focus {
  border-color: rgba(79, 70, 229, 0.5);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

/* ===== 按钮 ===== */
.btn-submit {
  width: 100%;
  padding: 12px;
  margin-top: 4px;
  background: #4f46e5;
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
  position: relative;
  overflow: hidden;
}
.btn-submit:hover:not(:disabled) {
  background: #4338ca;
  box-shadow: 0 4px 20px rgba(79, 70, 229, 0.35);
}
.btn-submit:active:not(:disabled) {
  transform: scale(0.98);
}
.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ===== 加载动画 ===== */
.spinner {
  display: inline-block;
  width: 18px; height: 18px;
  border: 2px solid rgba(255,255,255,0.2);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ===== 底部 ===== */
.auth-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 13px;
  color: #52525b;
}

/* ===== 响应式 ===== */
@media (max-width: 480px) {
  .auth-content {
    width: 100%;
    padding: 16px;
  }
  .auth-card {
    padding: 20px;
    border-radius: 16px;
  }
  .brand-mark {
    width: 48px; height: 48px;
    font-size: 24px;
    border-radius: 14px;
  }
  .brand-name { font-size: 20px; }
}
</style>
