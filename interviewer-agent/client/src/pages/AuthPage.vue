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
  errorMsg.value = ''
  successMsg.value = ''
  if (!email.value || !password.value) {
    errorMsg.value = '请填写邮箱和密码'
    return
  }

  isLoading.value = true
  try {
    if (isRegister.value) {
      const data = await signUp(email.value, password.value)
      if (data.user?.identities?.length === 0) {
        errorMsg.value = '该邮箱已注册，请直接登录'
      } else {
        successMsg.value = '注册成功！请查看邮箱确认链接（或直接登录）'
      }
    } else {
      await signIn(email.value, password.value)
      router.push('/')
    }
  } catch (err) {
    errorMsg.value = err.message || '操作失败'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <span class="brand-icon">🤖</span>
        <h1>面试官 Agent</h1>
        <p class="text-secondary">{{ isRegister ? '创建账号开始模拟面试' : '登录你的账号' }}</p>
      </div>

      <div v-if="errorMsg" class="error-message">{{ errorMsg }}</div>
      <div v-if="successMsg" class="success-message">{{ successMsg }}</div>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-group">
          <label class="form-label">邮箱</label>
          <input v-model="email" type="email" class="form-input" placeholder="your@email.com" />
        </div>
        <div class="form-group">
          <label class="form-label">密码</label>
          <input v-model="password" type="password" class="form-input" placeholder="至少6位" minlength="6" />
        </div>

        <button type="submit" class="btn btn-primary btn-block btn-lg" :disabled="isLoading">
          {{ isLoading ? '处理中...' : (isRegister ? '注册' : '登录') }}
        </button>
      </form>

      <div class="auth-footer">
        <button class="btn btn-ghost" @click="isRegister = !isRegister; errorMsg = ''; successMsg = ''">
          {{ isRegister ? '已有账号？去登录' : '没有账号？去注册' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  display: flex; align-items: center; justify-content: center;
  min-height: 100vh; padding: 24px;
  background: var(--bg-primary);
}
.auth-card {
  width: 100%; max-width: 400px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 32px;
}
.auth-header {
  text-align: center; margin-bottom: 24px;
}
.brand-icon { font-size: 40px; }
.auth-header h1 { font-size: 20px; margin: 8px 0 4px; }
.auth-form { display: flex; flex-direction: column; gap: 12px; }
.auth-footer {
  text-align: center; margin-top: 16px;
  padding-top: 16px; border-top: 1px solid var(--border-color);
}
</style>
