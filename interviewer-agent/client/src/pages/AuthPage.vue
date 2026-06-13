<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { signIn, signUp } from '@/services/auth.js'

const router = useRouter()
const email = ref('')
const password = ref('')
const mode = ref('login')
const loading = ref(false)
const err = ref('')
const ok = ref('')

async function submit() {
  err.value = ''; ok.value = ''
  if (!email.value || !password.value) { err.value = '请填写邮箱和密码'; return }
  if (password.value.length < 6) { err.value = '密码至少 6 位'; return }
  loading.value = true
  try {
    if (mode.value === 'register') {
      const d = await signUp(email.value, password.value)
      d.user?.identities?.length === 0 ? err.value = '该邮箱已注册' : ok.value = '注册成功，请登录'
    } else {
      await signIn(email.value, password.value)
      router.push('/')
    }
  } catch (e) {
    err.value = e.message === 'Invalid login credentials' ? '邮箱或密码错误' : e.message
  } finally { loading.value = false }
}
</script>

<template>
  <div class="page">
    <div class="wrap">
      <div class="brand">
        <div class="logo">🤖</div>
        <h1>面试官 Agent</h1>
        <p>AI 驱动的模拟技术面试平台</p>
      </div>

      <div class="card">
        <div class="tabs">
          <button :class="{ on: mode === 'login' }" @click="mode = 'login'; err = ''; ok = ''">登录</button>
          <button :class="{ on: mode === 'register' }" @click="mode = 'register'; err = ''; ok = ''">注册</button>
        </div>

        <div v-if="err" class="alert alert-err">{{ err }}</div>
        <div v-if="ok" class="alert alert-ok">{{ ok }}</div>

        <form @submit.prevent="submit">
          <label>邮箱</label>
          <input v-model="email" type="email" placeholder="name@company.com" />
          <label>密码</label>
          <input v-model="password" type="password" placeholder="至少 6 位" minlength="6" />
          <button type="submit" :disabled="loading">
            <span v-if="loading" class="spin"></span>
            <span v-else>{{ mode === 'login' ? '登录' : '创建账号' }}</span>
          </button>
        </form>

        <p class="switch">
          {{ mode === 'login' ? '还没有账号？' : '已有账号？' }}
          <a href="#" @click.prevent="mode = mode === 'login' ? 'register' : 'login'; err = ''; ok = ''">
            {{ mode === 'login' ? '立即注册' : '去登录' }}
          </a>
        </p>
      </div>

      <div class="features">
        <span>大厂 / 中厂 / 小厂</span>
        <span>JS · React · Vue · Node</span>
        <span>面试报告 + 数据分析</span>
        <span>简历解析 + 公司定制</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  background: #0c0c0e;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', sans-serif;
}

.wrap {
  width: 100%;
  max-width: 440px;
}

/* 品牌 */
.brand {
  text-align: center;
  margin-bottom: 36px;
}

.logo {
  width: 52px; height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  display: flex; align-items: center; justify-content: center;
  font-size: 24px;
  margin: 0 auto 16px;
  box-shadow: 0 8px 28px rgba(79,70,229,.35);
}

.brand h1 {
  font-size: 26px; font-weight: 800;
  color: #fafafa; letter-spacing: -.03em;
}

.brand p {
  font-size: 15px; color: #71717a; margin-top: 4px;
}

/* 卡片 */
.card {
  background: rgba(24,24,27,.8);
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 20px;
  padding: 36px 32px;
  backdrop-filter: blur(20px);
}

/* 切换 */
.tabs {
  display: flex; gap: 24px; margin-bottom: 28px;
}

.tabs button {
  border: none; background: none;
  font-size: 17px; font-weight: 700; color: #52525b;
  cursor: pointer; font-family: inherit; padding: 0;
}
.tabs button.on { color: #fafafa; }

/* 消息 */
.alert {
  padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 16px;
}
.alert-err { background: rgba(239,68,68,.08); color: #fca5a5; border: 1px solid rgba(239,68,68,.15); }
.alert-ok  { background: rgba(34,197,94,.08); color: #86efac; border: 1px solid rgba(34,197,94,.15); }

/* 表单 */
form { display: flex; flex-direction: column; gap: 14px; }

label {
  font-size: 12px; font-weight: 600; color: #71717a;
  text-transform: uppercase; letter-spacing: .06em;
}

input {
  width: 100%; padding: 11px 14px;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 10px;
  font-size: 14px; color: #fafafa; font-family: inherit; outline: none;
  box-sizing: border-box;
}
input::placeholder { color: #3f3f46; }
input:focus { border-color: rgba(79,70,229,.5); }

button[type="submit"] {
  width: 100%; margin-top: 6px; padding: 12px;
  background: #fafafa; border: none; border-radius: 12px;
  font-size: 15px; font-weight: 600; color: #0c0c0e;
  cursor: pointer; font-family: inherit;
  display: flex; align-items: center; justify-content: center;
  min-height: 46px;
}
button[type="submit"]:hover { background: #fff; }
button[type="submit"]:disabled { opacity: .4; cursor: not-allowed; }

.switch {
  text-align: center; margin-top: 20px;
  font-size: 13px; color: #52525b;
}
.switch a { color: #818cf8; text-decoration: none; font-weight: 500; }

/* 底部功能标签 */
.features {
  display: flex; flex-wrap: wrap; justify-content: center; gap: 12px;
  margin-top: 28px;
}

.features span {
  padding: 6px 14px;
  border-radius: 9999px;
  background: rgba(255,255,255,.04);
  color: #52525b;
  font-size: 13px;
  border: 1px solid rgba(255,255,255,.05);
}

/* 加载 */
.spin {
  width: 20px; height: 20px;
  border: 2px solid rgba(0,0,0,.15);
  border-top-color: #0c0c0e;
  border-radius: 50%;
  animation: spin .5s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 响应式 */
@media (max-width: 480px) {
  .page { padding: 24px 16px; }
  .brand { margin-bottom: 28px; }
  .card { padding: 28px 22px; border-radius: 16px; }
  .brand h1 { font-size: 22px; }
}
</style>
