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

function switchMode(m) {
  mode.value = m
  err.value = ''
  ok.value = ''
}

async function submit() {
  err.value = ''; ok.value = ''
  if (!email.value || !password.value) { err.value = '请填写邮箱和密码'; return }
  if (password.value.length < 6) { err.value = '密码至少 6 位'; return }
  loading.value = true
  try {
    if (mode.value === 'register') {
      const d = await signUp(email.value, password.value)
      d.user?.identities?.length === 0 ? err.value = '该邮箱已注册' : ok.value = '注册成功，请登录'
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
  <div class="auth">
    <!-- 左侧品牌区 -->
    <section class="brand">
      <div class="brand-glow brand-glow-1"></div>
      <div class="brand-glow brand-glow-2"></div>
      <div class="brand-grid"></div>

      <div class="brand-top">
        <div class="logo">
          <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
            <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
            <path d="M12 12l9-5M12 12v10M12 12L3 7" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
          </svg>
        </div>
        <span class="logo-name">InterviewAgent</span>
      </div>

      <div class="brand-mid">
        <h1>用 AI 模拟真实面试<br>把每一次技术面试<br>都准备到位</h1>
        <p>覆盖大厂、中厂、小厂三种面试强度，AI 面试官动态出题、智能追问、即时评分，并生成专属能力报告。</p>

        <ul class="features">
          <li>
            <span class="f-ico">
              <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
                <path d="M10 2v3m0 10v3m8-8h-3M5 10H2m13.07-5.07l-2.12 2.12M7.05 12.95l-2.12 2.12m10.14 0l-2.12-2.12M7.05 7.05L4.93 4.93" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/>
              </svg>
            </span>
            <div>
              <strong>真实面试模拟</strong>
              <span>根据你的简历与目标岗位动态生成问题，层层追问还原高压现场</span>
            </div>
          </li>
          <li>
            <span class="f-ico">
              <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
                <path d="M11 2L4 11h5l-1 7 7-9h-5l1-7z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
              </svg>
            </span>
            <div>
              <strong>即时评分反馈</strong>
              <span>每题打分、标准答案、薄弱点分析，结束后一键导出面试报告</span>
            </div>
          </li>
          <li>
            <span class="f-ico">
              <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
                <path d="M3 17h14M5 17V8l5-4 5 4v9M8 17v-4h4v4" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
              </svg>
            </span>
            <div>
              <strong>公司定制训练</strong>
              <span>上传 JD 精准匹配岗位要求，针对目标公司定向刷题</span>
            </div>
          </li>
        </ul>
      </div>

      <div class="brand-bottom">
        <div class="stat"><strong>3</strong><span>难度等级</span></div>
        <div class="divider"></div>
        <div class="stat"><strong>200+</strong><span>高频考题</span></div>
        <div class="divider"></div>
        <div class="stat"><strong>10+</strong><span>技术领域</span></div>
      </div>
    </section>

    <!-- 右侧登录区 -->
    <section class="panel">
      <div class="form-wrap">
        <header class="form-head">
          <h2>{{ mode === 'login' ? '欢迎回来' : '创建账号' }}</h2>
          <p>{{ mode === 'login' ? '登录以继续你的面试训练' : '注册后即可开始模拟面试' }}</p>
        </header>

        <div class="seg">
          <button :class="{ on: mode === 'login' }" @click="switchMode('login')">登录</button>
          <button :class="{ on: mode === 'register' }" @click="switchMode('register')">注册</button>
          <span class="seg-thumb" :class="{ right: mode === 'register' }"></span>
        </div>

        <transition name="fade">
          <div v-if="err" class="msg msg-err">{{ err }}</div>
        </transition>
        <transition name="fade">
          <div v-if="ok" class="msg msg-ok">{{ ok }}</div>
        </transition>

        <form @submit.prevent="submit">
          <div class="field">
            <label>邮箱地址</label>
            <div class="input-wrap">
              <svg class="i-ico" viewBox="0 0 20 20" fill="none" width="18" height="18">
                <rect x="2.5" y="4" width="15" height="12" rx="2" stroke="currentColor" stroke-width="1.4"/>
                <path d="M3 5l7 5 7-5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              </svg>
              <input v-model="email" type="email" placeholder="name@company.com" autocomplete="email" />
            </div>
          </div>

          <div class="field">
            <label>密码</label>
            <div class="input-wrap">
              <svg class="i-ico" viewBox="0 0 20 20" fill="none" width="18" height="18">
                <rect x="3.5" y="8.5" width="13" height="8" rx="2" stroke="currentColor" stroke-width="1.4"/>
                <path d="M6.5 8.5V6a3.5 3.5 0 017 0v2.5" stroke="currentColor" stroke-width="1.4"/>
              </svg>
              <input v-model="password" type="password" placeholder="至少 6 位字符" minlength="6" :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" />
            </div>
          </div>

          <button type="submit" class="submit" :disabled="loading">
            <span v-if="loading" class="spin"></span>
            <template v-else>
              {{ mode === 'login' ? '登 录' : '创建账号' }}
              <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                <path d="M4 10h11m0 0l-4-4m4 4l-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </template>
          </button>
        </form>

        <p class="switch">
          {{ mode === 'login' ? '还没有账号？' : '已有账号？' }}
          <a href="#" @click.prevent="switchMode(mode === 'login' ? 'register' : 'login')">
            {{ mode === 'login' ? '免费注册' : '立即登录' }}
          </a>
        </p>
      </div>

      <footer class="panel-foot">
        © 2026 InterviewAgent · 让面试不再焦虑
      </footer>
    </section>
  </div>
</template>

<style scoped>
.auth {
  display: flex;
  width: 100%;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', sans-serif;
  background: #fff;
}

/* ============ 左侧品牌区 ============ */
.brand {
  flex: 1.4;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 56px 64px;
  background:
    radial-gradient(120% 120% at 0% 0%, #6366f1 0%, #4f46e5 40%, #4338ca 100%);
  color: #fff;
}

.brand-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
}
.brand-glow-1 {
  width: 480px; height: 480px;
  background: rgba(129, 140, 248, .5);
  top: -160px; right: -120px;
}
.brand-glow-2 {
  width: 420px; height: 420px;
  background: rgba(99, 102, 241, .35);
  bottom: -160px; left: -100px;
}
.brand-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: radial-gradient(100% 100% at 50% 0%, #000 30%, transparent 80%);
  pointer-events: none;
}

.brand-top, .brand-mid, .brand-bottom { position: relative; z-index: 1; }

.brand-top {
  display: flex; align-items: center; gap: 11px;
}
.logo {
  width: 40px; height: 40px;
  border-radius: 11px;
  background: rgba(255,255,255,.14);
  border: 1px solid rgba(255,255,255,.2);
  backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
}
.logo-name {
  font-size: 17px; font-weight: 700; letter-spacing: -.01em;
}

.brand-mid h1 {
  font-size: 38px; font-weight: 800; line-height: 1.28;
  letter-spacing: -.03em; margin: 0 0 18px;
}
.brand-mid > p {
  font-size: 15px; line-height: 1.7;
  color: rgba(255,255,255,.78);
  max-width: 440px; margin: 0 0 40px;
}

.features {
  list-style: none; padding: 0; margin: 0;
  display: flex; flex-direction: column; gap: 22px;
}
.features li {
  display: flex; gap: 15px; align-items: flex-start;
}
.f-ico {
  width: 38px; height: 38px; flex-shrink: 0;
  border-radius: 10px;
  background: rgba(255,255,255,.13);
  border: 1px solid rgba(255,255,255,.18);
  display: flex; align-items: center; justify-content: center;
  color: #fff;
}
.features strong {
  display: block; font-size: 15px; font-weight: 650; margin-bottom: 4px;
}
.features span {
  font-size: 13.5px; line-height: 1.55;
  color: rgba(255,255,255,.68);
}

.brand-bottom {
  display: flex; align-items: center; gap: 32px;
}
.stat strong {
  display: block; font-size: 26px; font-weight: 800; letter-spacing: -.02em;
}
.stat span {
  font-size: 12.5px; color: rgba(255,255,255,.62); margin-top: 2px;
}
.divider { width: 1px; height: 34px; background: rgba(255,255,255,.18); }

/* ============ 右侧登录区 ============ */
.panel {
  flex: 1;
  min-width: 440px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 48px;
  position: relative;
}

.form-wrap {
  width: 100%;
  max-width: 380px;
  margin: auto;
}

.form-head { margin-bottom: 28px; }
.form-head h2 {
  font-size: 27px; font-weight: 800; color: #0f172a;
  letter-spacing: -.02em; margin: 0 0 7px;
}
.form-head p {
  font-size: 14.5px; color: #94a3b8; margin: 0;
}

/* 分段切换 */
.seg {
  position: relative;
  display: flex;
  background: #f1f5f9;
  border-radius: 11px;
  padding: 4px;
  margin-bottom: 26px;
}
.seg button {
  flex: 1; position: relative; z-index: 1;
  border: none; background: none;
  padding: 9px; font-size: 14px; font-weight: 600;
  color: #64748b; cursor: pointer; font-family: inherit;
  transition: color .2s;
}
.seg button.on { color: #4f46e5; }
.seg-thumb {
  position: absolute; top: 4px; left: 4px;
  width: calc(50% - 4px); height: calc(100% - 8px);
  background: #fff; border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,.08);
  transition: transform .25s cubic-bezier(.4,0,.2,1);
}
.seg-thumb.right { transform: translateX(100%); }

.msg {
  padding: 11px 14px; border-radius: 10px; font-size: 13.5px; margin-bottom: 16px;
}
.msg-err { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.msg-ok  { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }

form { display: flex; flex-direction: column; gap: 18px; }

.field label {
  display: block;
  font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 7px;
}
.input-wrap {
  position: relative; display: flex; align-items: center;
}
.i-ico {
  position: absolute; left: 14px; color: #cbd5e1; pointer-events: none;
  transition: color .15s;
}
.input-wrap input {
  width: 100%; padding: 12px 14px 12px 42px;
  border: 1.5px solid #e2e8f0; border-radius: 11px;
  font-size: 14.5px; color: #0f172a; font-family: inherit;
  outline: none; box-sizing: border-box;
  transition: border-color .15s, box-shadow .15s;
}
.input-wrap input::placeholder { color: #cbd5e1; }
.input-wrap input:focus {
  border-color: #4f46e5; box-shadow: 0 0 0 3.5px rgba(79,70,229,.1);
}
.input-wrap input:focus + .i-ico,
.input-wrap:focus-within .i-ico { color: #4f46e5; }

.submit {
  width: 100%; margin-top: 6px; padding: 13px;
  background: #4f46e5; border: none; border-radius: 11px;
  font-size: 15px; font-weight: 650; color: #fff;
  cursor: pointer; font-family: inherit; letter-spacing: .02em;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 48px;
  box-shadow: 0 4px 14px rgba(79,70,229,.3);
  transition: background .15s, transform .1s, box-shadow .15s;
}
.submit:hover { background: #4338ca; box-shadow: 0 6px 18px rgba(79,70,229,.38); }
.submit:active { transform: translateY(1px); }
.submit:disabled { opacity: .6; cursor: not-allowed; box-shadow: none; }

.switch {
  text-align: center; margin: 24px 0 0;
  font-size: 14px; color: #94a3b8;
}
.switch a { color: #4f46e5; text-decoration: none; font-weight: 600; }
.switch a:hover { text-decoration: underline; }

.panel-foot {
  position: absolute; bottom: 28px;
  font-size: 12.5px; color: #cbd5e1;
}

.spin {
  width: 19px; height: 19px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: #fff; border-radius: 50%;
  animation: spin .5s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.fade-enter-active, .fade-leave-active { transition: opacity .2s, transform .2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }

/* ============ 响应式 ============ */
@media (max-width: 980px) {
  .brand { display: none; }
  .panel { min-width: 0; flex: 1; }
}
@media (max-width: 420px) {
  .panel { padding: 32px 24px; }
}
</style>
