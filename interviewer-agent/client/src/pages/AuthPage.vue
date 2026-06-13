<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { signIn, signUp } from '@/services/auth.js'

const router = useRouter()
const email = ref('')
const password = ref('')
const mode = ref('login')
const loading = ref(false)
const err = ref('')
const ok = ref('')
const show = ref(false)

onMounted(() => requestAnimationFrame(() => show.value = true))

function switchMode(m) { mode.value = m; err.value = ''; ok.value = '' }

async function submit() {
  err.value = ''; ok.value = ''
  if (!email.value || !password.value) { err.value = '请填写邮箱和密码'; return }
  if (password.value.length < 6) { err.value = '密码至少 6 位'; return }
  loading.value = true
  try {
    if (mode.value === 'register') {
      const d = await signUp(email.value, password.value)
      d.user?.identities?.length === 0 ? err.value = '该邮箱已注册' : ok.value = '注册成功'
      if (!err.value) mode.value = 'login'
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
  <div class="auth" :class="{ in: show }">
    <!-- ====== 左侧品牌区 ====== -->
    <section class="left">
      <div class="left-bg"></div>
      <div class="left-inner">
        <div class="l-top">
          <div class="logo">
            <svg viewBox="0 0 32 32" fill="none" width="24" height="24">
              <path d="M16 2L3 9v14l13 7 13-7V9L16 2z" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
              <path d="M16 16l13-7M16 16v14M16 16L3 9" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="logo-text">InterviewAgent</span>
        </div>

        <div class="l-hero">
          <h1>把每一次面试<br>都变成机会</h1>
          <p>AI 驱动的模拟面试平台，基于真实背景动态出题、智能追问、即时打分。</p>
        </div>

        <ul class="l-feat">
          <li>
            <span class="lf-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/>
                <path d="M12 2v4m0 12v4M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83m0-14.14l-2.83 2.83m-8.48 8.48l-2.83 2.83" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </span>
            <div><strong>真实模拟</strong><span>大厂 / 中厂 / 小厂，智能追问</span></div>
          </li>
          <li>
            <span class="lf-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
              </svg>
            </span>
            <div><strong>即时反馈</strong><span>每题评分 + 标准答案 + 报告</span></div>
          </li>
          <li>
            <span class="lf-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                <path d="M3 21h18M6 21V10l6-5 6 5v11M10 21v-5h4v5" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
              </svg>
            </span>
            <div><strong>岗位定制</strong><span>上传 JD，精准匹配考点</span></div>
          </li>
        </ul>
      </div>
    </section>

    <!-- ====== 右侧表单区 ====== -->
    <section class="right">
      <div class="card">
        <h2 class="card-title">{{ mode === 'login' ? '欢迎回来' : '创建账号' }}</h2>
        <p class="card-sub">{{ mode === 'login' ? '登录继续你的面试训练' : '注册后即可免费使用' }}</p>

        <div class="tabs">
          <button :class="{ on: mode === 'login' }" @click="switchMode('login')">登录</button>
          <button :class="{ on: mode === 'register' }" @click="switchMode('register')">注册</button>
        </div>

        <Transition name="msg">
          <div v-if="err" class="alert err">{{ err }}</div>
        </Transition>
        <Transition name="msg">
          <div v-if="ok" class="alert suc">{{ ok }}</div>
        </Transition>

        <form @submit.prevent="submit">
          <div class="field">
            <label>邮箱地址</label>
            <input v-model="email" type="email" placeholder="name@company.com" autocomplete="email" />
          </div>
          <div class="field">
            <label>密码</label>
            <input v-model="password" type="password" placeholder="至少 6 位" minlength="6" :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" />
          </div>
          <button type="submit" class="btn" :disabled="loading">
            <span v-if="loading" class="spin"></span>
            <span v-else>{{ mode === 'login' ? '登 录' : '创建账号' }}</span>
          </button>
        </form>

        <p class="foot">
          {{ mode === 'login' ? '还没有账号？' : '已有账号？' }}
          <a href="#" @click.prevent="switchMode(mode === 'login' ? 'register' : 'login')">
            {{ mode === 'login' ? '免费注册' : '立即登录' }}
          </a>
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

.auth {
  display: flex;
  width: 100%;
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: #f8fafc;
}

/* ==================== 左侧 ==================== */
.left {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: linear-gradient(160deg, #1E3A8A 0%, #1e40af 40%, #1d4ed8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.left-bg {
  position: absolute; inset: 0;
  pointer-events: none;
}
.left-bg::before {
  content: '';
  position: absolute;
  width: 600px; height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(59,130,246,.3) 0%, transparent 70%);
  top: -200px; right: -100px;
}
.left-bg::after {
  content: '';
  position: absolute;
  width: 400px; height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(37,99,235,.25) 0%, transparent 70%);
  bottom: -120px; left: -60px;
}

.left-inner {
  position: relative; z-index: 1;
  padding: 64px;
  max-width: 560px;
  opacity: 0; transform: translateY(16px);
  transition: opacity .7s ease .1s, transform .7s ease .1s;
}
.auth.in .left-inner { opacity: 1; transform: translateY(0); }

.l-top {
  display: flex; align-items: center; gap: 10px; margin-bottom: 56px;
}
.logo {
  width: 44px; height: 44px;
  border-radius: 12px;
  background: rgba(255,255,255,.12);
  border: 1px solid rgba(255,255,255,.18);
  display: flex; align-items: center; justify-content: center;
}
.logo-text {
  font-size: 18px; font-weight: 700; color: #fff; letter-spacing: -.01em;
}

.l-hero { margin-bottom: 52px; }
.l-hero h1 {
  font-size: 42px; font-weight: 900; color: #fff;
  line-height: 1.18; letter-spacing: -.03em; margin-bottom: 16px;
}
.l-hero p {
  font-size: 16px; color: rgba(255,255,255,.7);
  line-height: 24px; max-width: 440px;
}

.l-feat {
  list-style: none; display: flex; flex-direction: column; gap: 20px;
}
.l-feat li {
  display: flex; gap: 14px; align-items: flex-start;
}
.lf-icon {
  width: 40px; height: 40px; flex-shrink: 0;
  border-radius: 10px;
  background: rgba(255,255,255,.1);
  display: flex; align-items: center; justify-content: center;
  color: #93c5fd;
  transition: background .2s;
}
.l-feat strong {
  display: block; font-size: 15px; font-weight: 600; color: #fff;
  margin-bottom: 2px;
}
.l-feat span {
  font-size: 13px; color: rgba(255,255,255,.6);
  line-height: 24px;
}

/* ==================== 右侧 ==================== */
.right {
  flex: 1;
  display: flex; align-items: center; justify-content: center;
  padding: 48px;
}

.card {
  width: 100%; max-width: 420px;
  opacity: 0; transform: translateY(12px);
  transition: opacity .6s ease .2s, transform .6s ease .2s;
}
.auth.in .card { opacity: 1; transform: translateY(0); }

.card-title {
  font-size: 28px; font-weight: 800; color: #0f172a;
  letter-spacing: -.02em; margin-bottom: 4px;
}
.card-sub {
  font-size: 15px; color: #64748b;
  line-height: 24px; margin-bottom: 24px;
}

/* ---- tabs ---- */
.tabs {
  display: flex; gap: 24px; margin-bottom: 24px;
  padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;
}
.tabs button {
  border: none; background: none;
  font-size: 15px; font-weight: 600; color: #94a3b8;
  cursor: pointer; font-family: inherit; padding: 0;
  transition: color .2s; position: relative;
}
.tabs button.on { color: #1E3A8A; }
.tabs button.on::after {
  content: '';
  position: absolute; bottom: -17px; left: 0; right: 0; height: 2px;
  background: #1E3A8A; border-radius: 1px;
}

/* ---- alerts ---- */
.alert {
  padding: 11px 14px; border-radius: 10px;
  font-size: 13px; margin-bottom: 18px; line-height: 24px;
}
.err { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.suc { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }

/* ---- form ---- */
form { display: flex; flex-direction: column; gap: 16px; }

.field label {
  display: block; font-size: 13px; font-weight: 600;
  color: #334155; margin-bottom: 6px;
  line-height: 24px;
}

.field input {
  width: 100%; padding: 11px 15px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px; color: #0f172a;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  outline: none; background: #fff;
  line-height: 24px;
  transition: border-color .2s, box-shadow .2s;
}
.field input::placeholder { color: #cbd5e1; }
.field input:hover { border-color: #1E3A8A; }
.field input:focus {
  border-color: #1E3A8A;
  box-shadow: 0 0 0 3px rgba(30,58,138,.08);
}

/* ---- button ---- */
.btn {
  width: 100%; margin-top: 6px; padding: 12px;
  background: linear-gradient(135deg, #1E3A8A, #1d4ed8);
  border: none; border-radius: 9999px;
  font-size: 15px; font-weight: 600; color: #fff;
  cursor: pointer; font-family: inherit;
  min-height: 48px; line-height: 24px;
  transition: opacity .2s, transform .15s, box-shadow .2s;
  box-shadow: 0 4px 14px rgba(30,58,138,.25);
}
.btn:hover { box-shadow: 0 6px 20px rgba(30,58,138,.35); }
.btn:active { transform: scale(.98); }
.btn:disabled { opacity: .5; cursor: not-allowed; }

/* ---- footer link ---- */
.foot {
  text-align: center; margin-top: 24px;
  font-size: 14px; color: #94a3b8; line-height: 24px;
}
.foot a {
  color: #1E3A8A; text-decoration: none; font-weight: 600;
  position: relative;
}
.foot a::after {
  content: '';
  position: absolute; bottom: -2px; left: 0; right: 0; height: 1.5px;
  background: #1E3A8A;
  transform: scaleX(0);
  transition: transform .2s ease;
  transform-origin: left;
}
.foot a:hover::after { transform: scaleX(1); }

/* ---- 加载 ---- */
.spin {
  width: 19px; height: 19px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: #fff; border-radius: 50%;
  animation: spin .5s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ---- 消息动画 ---- */
.msg-enter-active, .msg-leave-active { transition: all .2s ease; }
.msg-enter-from, .msg-leave-to { opacity: 0; transform: translateY(-4px); }

/* ==================== 响应式 ==================== */
@media (max-width: 860px) {
  .left { display: none; }
  .right { flex: 1; }
}
@media (max-width: 480px) {
  .right { padding: 32px 20px; }
  .card-title { font-size: 24px; }
}
</style>
