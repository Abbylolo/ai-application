<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { signIn, signUp } from '@/services/auth.js'

const router = useRouter()
const email = ref('')
const password = ref('')
const isRegister = ref(false)
const isLoading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

async function handleSubmit() {
  errorMsg.value = ''; successMsg.value = ''
  if (!email.value || !password.value) { errorMsg.value = '请填写邮箱和密码'; return }
  if (password.value.length < 6) { errorMsg.value = '密码至少6位'; return }
  isLoading.value = true
  try {
    if (isRegister.value) {
      const data = await signUp(email.value, password.value)
      data.user?.identities?.length === 0
        ? errorMsg.value = '该邮箱已注册'
        : successMsg.value = '注册成功！可直接登录'
    } else {
      await signIn(email.value, password.value)
      router.push('/')
    }
  } catch (err) {
    errorMsg.value = err.message === 'Invalid login credentials' ? '邮箱或密码错误' : err.message
  } finally { isLoading.value = false }
}
</script>

<template>
  <div class="root">
    <!-- 背景纹理 -->
    <div class="bg"></div>

    <!-- 主卡片 -->
    <div class="card">
      <div class="card-inner">
        <!-- 品牌 -->
        <div class="brand">
          <div class="logo">🤖</div>
          <h1>面试官 Agent</h1>
          <p>AI 驱动的模拟技术面试平台</p>
        </div>

        <!-- Tab -->
        <div class="tabs">
          <button :class="{ on: !isRegister }" @click="isRegister = false; errorMsg = ''; successMsg = ''">登录</button>
          <button :class="{ on: isRegister }" @click="isRegister = true; errorMsg = ''; successMsg = ''">注册</button>
        </div>

        <!-- 消息 -->
        <div v-if="errorMsg" class="msg err">{{ errorMsg }}</div>
        <div v-if="successMsg" class="msg ok">{{ successMsg }}</div>

        <!-- 表单 -->
        <form @submit.prevent="handleSubmit">
          <input v-model="email" type="email" placeholder="邮箱地址" autocomplete="email" />
          <input v-model="password" type="password" placeholder="密码（至少6位）" minlength="6" autocomplete="current-password" />
          <button type="submit" :disabled="isLoading">
            {{ isLoading ? '...' : (isRegister ? '创建账号' : '登录') }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

* { box-sizing: border-box; }

.root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: #fafafa;
}

/* 背景装饰 */
.bg {
  position: fixed; inset: 0;
  background:
    radial-gradient(ellipse 80% 50% at 50% -20%, #e0e7ff 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 100% 80%, #fae8ff 0%, transparent 50%),
    radial-gradient(ellipse 40% 30% at 0% 100%, #dbeafe 0%, transparent 40%);
  pointer-events: none;
}

/* 卡片 */
.card {
  position: relative;
  width: 400px;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 24px;
  box-shadow:
    0 1px 2px rgba(0,0,0,0.04),
    0 8px 32px rgba(0,0,0,0.06),
    0 20px 60px rgba(0,0,0,0.04);
}

.card-inner {
  padding: 40px 36px;
}

/* 品牌 */
.brand {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  width: 56px; height: 56px;
  margin: 0 auto 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px;
  background: linear-gradient(135deg, #eef2ff, #e0e7ff);
  border-radius: 16px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8);
}

.brand h1 {
  font-size: 22px; font-weight: 700; color: #18181b;
  letter-spacing: -0.03em; margin-bottom: 5px;
}

.brand p {
  font-size: 14px; color: #a1a1aa;
}

/* Tab */
.tabs {
  display: flex;
  background: #f4f4f5;
  border-radius: 10px;
  padding: 3px;
  margin-bottom: 20px;
}

.tabs button {
  flex: 1;
  padding: 8px 0;
  border: none;
  background: none;
  font-size: 14px; font-weight: 500;
  color: #71717a;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  font-family: inherit;
}

.tabs button.on {
  background: #fff;
  color: #18181b;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

/* 消息 */
.msg {
  padding: 10px 14px; border-radius: 10px;
  font-size: 13px; margin-bottom: 16px;
}
.err { background: #fff5f5; color: #e5484d; border: 1px solid #ffcdce; }
.ok  { background: #f2fcf5; color: #30a46c; border: 1px solid #b7ebd0; }

/* 表单 */
form {
  display: flex; flex-direction: column; gap: 12px;
}

input {
  width: 100%;
  padding: 11px 15px;
  border: 1.5px solid #e4e4e7;
  border-radius: 12px;
  font-size: 14px;
  color: #18181b;
  background: #fafafa;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}

input:focus {
  border-color: #4f46e5;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(79,70,229,0.08);
}

input::placeholder { color: #c4c4c4; }

button[type="submit"] {
  width: 100%;
  margin-top: 6px;
  padding: 12px;
  background: #18181b;
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 15px; font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s, transform 0.1s;
}

button[type="submit"]:hover:not(:disabled) {
  background: #3f3f46;
}

button[type="submit"]:active:not(:disabled) {
  transform: scale(0.98);
}

button[type="submit"]:disabled {
  opacity: 0.5; cursor: not-allowed;
}

/* 响应式 */
@media (max-width: 440px) {
  .card { width: 100%; }
  .card-inner { padding: 28px 22px; }
  .brand h1 { font-size: 20px; }
}
</style>
