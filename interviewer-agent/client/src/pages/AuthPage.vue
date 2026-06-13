<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { signIn, signUp } from '@/services/auth.js'

const router = useRouter()
const email = ref('')
const password = ref('')
const mode = ref('login') // 'login' | 'register'
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
      d.user?.identities?.length === 0
        ? err.value = '该邮箱已注册'
        : ok.value = '注册成功，请登录'
    } else {
      await signIn(email.value, password.value)
      router.push('/')
    }
  } catch (e) {
    err.value = e.message === 'Invalid login credentials' ? '邮箱或密码错误' : e.message
  } finally { loading.value = false }
}

function swap() {
  mode.value = mode.value === 'login' ? 'register' : 'login'
  err.value = ''; ok.value = ''
}
</script>

<template>
  <div class="shell">
    <!-- 背景纹理 -->
    <div class="bg-noise"></div>
    <div class="bg-lines"></div>
    <div class="bg-glow bg-glow--tl"></div>
    <div class="bg-glow bg-glow--br"></div>

    <!-- 卡片 -->
    <div class="card">
      <div class="card-head">
        <div class="logo">🤖</div>
        <h1>面试官 Agent</h1>
        <p>AI 驱动的模拟技术面试平台</p>
      </div>

      <div class="switch">
        <button :class="{ active: mode === 'login' }" @click="mode = 'login'; err = ''; ok = ''">登录</button>
        <button :class="{ active: mode === 'register' }" @click="mode = 'register'; err = ''; ok = ''">注册</button>
      </div>

      <div v-if="err" class="msg msg--err">{{ err }}</div>
      <div v-if="ok" class="msg msg--ok">{{ ok }}</div>

      <form @submit.prevent="submit" class="form">
        <div class="field">
          <label>邮箱</label>
          <input v-model="email" type="email" placeholder="name@company.com" autocomplete="email" />
        </div>
        <div class="field">
          <label>密码</label>
          <input v-model="password" type="password" placeholder="········" minlength="6" autocomplete="current-password" />
        </div>
        <button type="submit" :disabled="loading" class="btn">
          <span v-if="loading" class="dot-spin"></span>
          <span v-else>{{ mode === 'login' ? '登录' : '创建账号' }}</span>
        </button>
      </form>

      <p class="foot">
        {{ mode === 'login' ? '还没有账号？' : '已有账号？' }}
        <a href="#" @click.prevent="swap">{{ mode === 'login' ? '立即注册' : '去登录' }}</a>
      </p>
    </div>
  </div>
</template>

<style scoped>
/* === 外壳 === */
.shell {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0c0c0e;
  position: relative;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', sans-serif;
}

/* === 背景层 === */
.bg-noise {
  position: absolute; inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.03'/%3E%3C/svg%3E");
  pointer-events: none;
}

.bg-lines {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px);
  background-size: 64px 64px;
  pointer-events: none;
}

.bg-glow {
  position: absolute;
  width: 640px; height: 640px;
  border-radius: 50%;
  filter: blur(160px);
  pointer-events: none;
}
.bg-glow--tl {
  top: -300px; left: -200px;
  background: rgba(79, 70, 229, .12);
}
.bg-glow--br {
  bottom: -300px; right: -200px;
  background: rgba(99, 102, 241, .08);
}

/* === 卡片 === */
.card {
  position: relative;
  width: 440px;
  background: rgba(22, 22, 26, .85);
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 24px;
  padding: 44px 40px;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  box-shadow:
    0 0 0 1px rgba(255,255,255,.03) inset,
    0 1px 2px rgba(0,0,0,.4),
    0 24px 80px rgba(0,0,0,.6);
  animation: card-up .6s ease;
}

@keyframes card-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* === 头部 === */
.card-head {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  width: 52px; height: 52px;
  margin: 0 auto 14px;
  border-radius: 14px;
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; font-weight: 700; color: #fff;
  box-shadow: 0 8px 24px rgba(79,70,229,.3);
}

.card-head h1 {
  font-size: 22px; font-weight: 700;
  color: #fafafa; letter-spacing: -.02em;
}

.card-head p {
  font-size: 14px; color: #71717a;
  margin-top: 5px;
}

/* === 切换 === */
.switch {
  display: flex;
  background: rgba(255,255,255,.04);
  border-radius: 10px;
  padding: 3px;
  margin-bottom: 20px;
}

.switch button {
  flex: 1; padding: 8px 0;
  border: none; background: none;
  font-size: 14px; font-weight: 500; color: #71717a;
  cursor: pointer; border-radius: 8px;
  transition: all .2s; font-family: inherit;
}

.switch button.active {
  background: rgba(255,255,255,.08);
  color: #fafafa;
}

/* === 消息 === */
.msg {
  padding: 10px 14px; border-radius: 10px;
  font-size: 13px; margin-bottom: 16px;
}
.msg--err {
  background: rgba(239,68,68,.08); color: #fca5a5;
  border: 1px solid rgba(239,68,68,.15);
}
.msg--ok {
  background: rgba(34,197,94,.08); color: #86efac;
  border: 1px solid rgba(34,197,94,.15);
}

/* === 表单 === */
.form {
  display: flex; flex-direction: column; gap: 16px;
}

.field label {
  display: block;
  font-size: 12px; font-weight: 600; color: #a1a1aa;
  text-transform: uppercase; letter-spacing: .06em;
  margin-bottom: 6px;
}

.field input {
  width: 100%; padding: 11px 14px;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 10px;
  font-size: 14px; color: #fafafa;
  font-family: inherit;
  outline: none;
  transition: border-color .2s, box-shadow .2s;
}
.field input::placeholder { color: #3f3f46; }
.field input:focus {
  border-color: rgba(79,70,229,.5);
  box-shadow: 0 0 0 3px rgba(79,70,229,.1);
}

/* === 按钮 === */
.btn {
  width: 100%; margin-top: 6px;
  padding: 13px;
  background: #fafafa;
  border: none; border-radius: 12px;
  font-size: 15px; font-weight: 600; color: #0c0c0e;
  cursor: pointer; font-family: inherit;
  transition: all .15s;
  display: flex; align-items: center; justify-content: center;
  min-height: 46px;
}
.btn:hover { background: #fff; box-shadow: 0 4px 20px rgba(255,255,255,.1); }
.btn:active { transform: scale(.98); }
.btn:disabled { opacity: .4; cursor: not-allowed; }

/* === 底部 === */
.foot {
  text-align: center; margin-top: 22px;
  font-size: 13px; color: #52525b;
}
.foot a {
  color: #818cf8; text-decoration: none; font-weight: 500;
}
.foot a:hover { text-decoration: underline; }

/* === 加载 === */
.dot-spin {
  width: 20px; height: 20px;
  border: 2px solid rgba(0,0,0,.15);
  border-top-color: #0c0c0e;
  border-radius: 50%;
  animation: spin .5s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* === 响应式 === */
@media (max-width: 480px) {
  .card {
    width: 100%; margin: 16px;
    padding: 32px 24px; border-radius: 18px;
  }
  .card-head h1 { font-size: 20px; }
}
</style>
