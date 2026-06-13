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

onMounted(() => {
  requestAnimationFrame(() => show.value = true)
})

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
  <div class="auth">
    <!-- 动态背景 - 全局 -->
    <div class="bg-orb orb-a"></div>
    <div class="bg-orb orb-b"></div>
    <div class="bg-orb orb-c"></div>
    <div class="bg-line"></div>

    <section class="brand">
      <div class="brand-inner" :class="{ in: show }">
        <!-- Logo -->
        <div class="top" style="--d:0ms">
          <div class="logo">
            <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
              <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
              <path d="M12 12l9-5M12 12v10M12 12L3 7" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="logo-name">InterviewAgent</span>
        </div>

        <!-- 主标题 -->
        <div class="mid" style="--d:120ms">
          <h1>把每一次面试<br>都变成机会</h1>
          <p>AI 模拟面试平台。基于你的真实背景与目标岗位，动态生成考题、智能追问、即时打分，让每次练习都逼近真实面试。</p>
        </div>

        <!-- 亮点列表 -->
        <ul class="feat" style="--d:240ms">
          <li>
            <i class="fi fi-a">
              <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
                <circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/>
                <path d="M10 2v3m0 10v3m8-8h-3M5 10H2m13.07-5.07l-2.12 2.12M7.05 12.95l-2.12 2.12m10.14 0l-2.12-2.12M7.05 7.05L4.93 4.93" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </i>
            <div><strong>真实模拟</strong><span>大厂 / 中厂 / 小厂三档强度，智能追问层层深入</span></div>
          </li>
          <li>
            <i class="fi fi-b">
              <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
                <path d="M11 2L4 11h5l-1 7 7-9h-5l1-7z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
              </svg>
            </i>
            <div><strong>即时反馈</strong><span>每题评分 + 标准答案对比，面试后一键导出报告</span></div>
          </li>
          <li>
            <i class="fi fi-c">
              <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
                <path d="M3 17h14M5 17V8l5-4 5 4v9M8 17v-4h4v4" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
              </svg>
            </i>
            <div><strong>岗位定制</strong><span>上传 JD 精准匹配考点，也支持简历智能解析</span></div>
          </li>
        </ul>

      </div>
    </section>

    <section class="panel">
      <div class="form-block" :class="{ in: show }">
        <header class="head" style="--d:180ms">
          <h2>{{ mode === 'login' ? '欢迎回来' : '创建账号' }}</h2>
          <p>{{ mode === 'login' ? '登录以继续面试训练' : '注册后即可免费使用' }}</p>
        </header>

        <div class="seg" style="--d:260ms">
          <button :class="{ on: mode === 'login' }" @click="switchMode('login')">登录</button>
          <button :class="{ on: mode === 'register' }" @click="switchMode('register')">注册</button>
          <span class="seg-bar" :class="{ r: mode === 'register' }"></span>
        </div>

        <Transition name="msg">
          <div v-if="err" class="msg msg-e">{{ err }}</div>
        </Transition>
        <Transition name="msg">
          <div v-if="ok" class="msg msg-s">{{ ok }}</div>
        </Transition>

        <form @submit.prevent="submit" style="--d:320ms">
          <div class="fld">
            <label>邮箱地址</label>
            <span class="inp">
              <svg class="ii" viewBox="0 0 20 20" fill="none" width="17" height="17">
                <rect x="2.5" y="4" width="15" height="12" rx="2" stroke="currentColor" stroke-width="1.4"/>
                <path d="M3 5l7 5 7-5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              </svg>
              <input v-model="email" type="email" placeholder="name@company.com" autocomplete="email" />
            </span>
          </div>
          <div class="fld">
            <label>密码</label>
            <span class="inp">
              <svg class="ii" viewBox="0 0 20 20" fill="none" width="17" height="17">
                <rect x="3.5" y="8.5" width="13" height="8" rx="2" stroke="currentColor" stroke-width="1.4"/>
                <path d="M6.5 8.5V6a3.5 3.5 0 017 0v2.5" stroke="currentColor" stroke-width="1.4"/>
              </svg>
              <input v-model="password" type="password" placeholder="至少 6 位字符" minlength="6" :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" />
            </span>
          </div>

          <button type="submit" class="btn" :disabled="loading">
            <template v-if="loading">
              <span class="spin"></span>
            </template>
            <template v-else>
              <span>{{ mode === 'login' ? '登 录' : '创建账号' }}</span>
              <svg class="arr" viewBox="0 0 20 20" fill="none" width="16" height="16">
                <path d="M4 10h11m0 0l-4-4m4 4l-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </template>
          </button>
        </form>

        <p class="sw" style="--d:400ms">
          {{ mode === 'login' ? '还没有账号？' : '已有账号？' }}
          <a href="#" @click.prevent="switchMode(mode === 'login' ? 'register' : 'login')">{{ mode === 'login' ? '免费注册' : '立即登录' }}</a>
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.auth {
  display: flex;
  width: 100%;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', sans-serif;
  background: linear-gradient(155deg, #4338ca 0%, #4f46e5 45%, #6366f1 100%);
  position: relative;
  overflow: hidden;
}

/* ==================== 左侧品牌区 ==================== */
.brand {
  flex: 1.4;
  position: relative;
}

/* 动态光球 - 全局 */
.bg-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}
.orb-a {
  width: 520px; height: 520px;
  background: radial-gradient(circle, rgba(129,140,248,.55) 0%, transparent 70%);
  top: -180px; right: -100px;
  animation: drift 14s ease-in-out infinite;
}
.orb-b {
  width: 380px; height: 380px;
  background: radial-gradient(circle, rgba(99,102,241,.4) 0%, transparent 70%);
  bottom: -140px; left: -80px;
  animation: drift 18s ease-in-out infinite reverse;
}
.orb-c {
  width: 260px; height: 260px;
  background: radial-gradient(circle, rgba(199,210,254,.3) 0%, transparent 70%);
  top: 50%; left: 50%;
  animation: drift 22s ease-in-out infinite;
}
@keyframes drift {
  0%, 100% { transform: translate(0,0) scale(1); }
  33%  { transform: translate(40px,-30px) scale(1.06); }
  66%  { transform: translate(-25px,20px) scale(.95); }
}

.bg-line {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);
  background-size: 50px 50px;
  mask-image: radial-gradient(120% 120% at 20% 50%, #000 40%, transparent 70%);
  pointer-events: none;
}

.brand-inner {
  position: relative; z-index: 1;
  padding: 72px 72px 72px 96px;
  max-width: 700px;
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* 入场动效 */
.top, .mid, .feat {
  opacity: 0; transform: translateY(20px);
  transition: opacity .7s ease, transform .7s ease;
  transition-delay: var(--d, 0ms);
}
.brand-inner.in .top,
.brand-inner.in .mid,
.brand-inner.in .feat {
  opacity: 1; transform: translateY(0);
}

.top {
  display: flex; align-items: center; gap: 12px;
}
.logo {
  width: 48px; height: 48px;
  border-radius: 14px;
  background: rgba(255,255,255,.15);
  border: 1px solid rgba(255,255,255,.2);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  color: #fff;
}
.logo svg { width: 26px; height: 26px; }
.logo-name {
  font-size: 19px; font-weight: 700; color: #fff; letter-spacing: -.01em;
}

/* slogan 在 logo 下方适当留白 */
.mid { margin-top: 72px; }
.mid h1 {
  font-size: 60px; font-weight: 900; line-height: 1.1;
  letter-spacing: -.04em; color: #fff; margin: 0 0 28px;
}
.mid p {
  font-size: 18px; line-height: 1.7; color: rgba(255,255,255,.72);
  max-width: 560px; margin: 0;
}

/* 功能列表推到底部 */
.feat {
  list-style: none; padding: 0; margin: auto 0 0;
  display: flex; flex-direction: column; gap: 22px;
  padding-bottom: 4px;
}
.feat li {
  display: flex; gap: 16px; align-items: flex-start;
}
.fi {
  width: 40px; height: 40px;
  border-radius: 11px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  color: #fff; transition: transform .2s;
}
.fi-a { background: rgba(129,140,248,.35); }
.fi-b { background: rgba(167,139,250,.35); }
.fi-c { background: rgba(96,165,250,.35); }
.feat li:hover .fi { transform: scale(1.1); }

.feat strong {
  display: block; font-size: 16px; font-weight: 650; color: #fff; margin-bottom: 4px;
}
.feat span {
  font-size: 14px; line-height: 1.5; color: rgba(255,255,255,.6);
}

/* ==================== 右侧面板 ==================== */
.panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.form-block {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 20px;
  padding: 44px 40px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 16px 48px rgba(0,0,0,.12);
}

.head, .seg, form, .sw {
  opacity: 0; transform: translateY(16px);
  transition: opacity .6s ease, transform .6s ease;
  transition-delay: var(--d, 0ms);
}
.form-block.in .head,
.form-block.in .seg,
.form-block.in form,
.form-block.in .sw {
  opacity: 1; transform: translateY(0);
}

.head { margin-bottom: 26px; }
.head h2 {
  font-size: 30px; font-weight: 800; color: #0f172a;
  letter-spacing: -.03em; margin: 0 0 6px;
}
.head p { font-size: 15px; color: #94a3b8; margin: 0; }

/* 分段切换 */
.seg {
  position: relative; display: flex;
  background: #f1f5f9; border-radius: 12px; padding: 4px;
  margin-bottom: 28px;
}
.seg button {
  flex: 1; position: relative; z-index: 1;
  border: none; background: none;
  padding: 10px; font-size: 15px; font-weight: 600;
  color: #64748b; cursor: pointer; font-family: inherit;
  transition: color .25s;
}
.seg button.on { color: #4f46e5; }
.seg-bar {
  position: absolute; top: 4px; left: 4px;
  width: calc(50% - 4px); height: calc(100% - 8px);
  background: #fff; border-radius: 9px;
  box-shadow: 0 1px 3px rgba(0,0,0,.07);
  transition: transform .3s cubic-bezier(.4,0,.2,1);
}
.seg-bar.r { transform: translateX(100%); }

/* 消息 */
.msg {
  padding: 12px 14px; border-radius: 10px; font-size: 14px; margin-bottom: 18px;
}
.msg-e { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.msg-s { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }

.msg-enter-active, .msg-leave-active { transition: all .25s ease; }
.msg-enter-from, .msg-leave-to { opacity: 0; transform: translateY(-6px); }

/* 表单 */
form { display: flex; flex-direction: column; gap: 20px; flex: 1; justify-content: center; }

.fld label {
  display: block; font-size: 14px; font-weight: 600;
  color: #475569; margin-bottom: 7px;
}
.inp {
  position: relative; display: flex; align-items: center;
}
.ii {
  position: absolute; left: 16px; color: #cbd5e1; width: 18px; height: 18px;
  transition: color .2s;
}
.inp input {
  width: 100%; padding: 14px 16px 14px 46px;
  border: 1.5px solid #e2e8f0; border-radius: 12px;
  font-size: 15px; color: #0f172a; font-family: inherit;
  outline: none; box-sizing: border-box;
  transition: border-color .2s, box-shadow .2s;
  background: #f9fafb;
}
.inp input::placeholder { color: #cbd5e1; }
.inp input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3.5px rgba(79,70,229,.1);
  background: #fff;
}
.inp:focus-within .ii { color: #4f46e5; }

/* 按钮 */
.btn {
  width: 100%; margin-top: 8px; padding: 14px;
  background: #4f46e5; border: none; border-radius: 12px;
  font-size: 16px; font-weight: 650; color: #fff;
  cursor: pointer; font-family: inherit;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  min-height: 50px;
  box-shadow: 0 4px 16px rgba(79,70,229,.28);
  transition: background .2s, transform .15s, box-shadow .2s;
  overflow: hidden;
  position: relative;
}
.btn::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,.1) 50%, transparent 60%);
  transform: translateX(-100%);
  transition: transform .6s;
}
.btn:hover::after { transform: translateX(100%); }
.btn:hover { background: #4338ca; box-shadow: 0 6px 20px rgba(79,70,229,.38); }
.btn:active { transform: scale(.98); }
.btn:disabled { opacity: .6; cursor: not-allowed; }
.btn:disabled::after { display: none; }

.arr {
  transition: transform .2s;
}
.btn:hover .arr { transform: translateX(2px); }

.sw {
  text-align: center; margin: 28px 0 0;
  font-size: 15px; color: #94a3b8;
}
.sw a { color: #4f46e5; text-decoration: none; font-weight: 600; }
.sw a:hover { text-decoration: underline; }

/* 加载 */
.spin {
  width: 19px; height: 19px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: #fff; border-radius: 50%;
  animation: spin .5s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ==================== 响应式 ==================== */
@media (max-width: 980px) {
  .brand { display: none; }
  .panel { flex: 1; }
}
</style>
