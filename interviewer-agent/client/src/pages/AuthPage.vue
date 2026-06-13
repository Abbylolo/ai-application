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
  <div class="root">
    <!-- 左侧品牌 -->
    <div class="left">
      <div class="left-top">
        <div class="logo">🤖</div>
        <h1>面试官 Agent</h1>
        <p class="subtitle">AI 驱动的模拟技术面试平台</p>
      </div>

      <div class="features">
        <div class="ft">
          <span class="ft-icon">🎯</span>
          <div><strong>真实面试模拟</strong><span>大厂 / 中厂 / 小厂三种难度，智能追问</span></div>
        </div>
        <div class="ft">
          <span class="ft-icon">⚡</span>
          <div><strong>即时评估反馈</strong><span>每题评分 + 标准答案 + 薄弱分析</span></div>
        </div>
        <div class="ft">
          <span class="ft-icon">🏢</span>
          <div><strong>公司定制面试</strong><span>上传 JD，精准匹配岗位要求出题</span></div>
        </div>
        <div class="ft">
          <span class="ft-icon">📊</span>
          <div><strong>数据统计分析</strong><span>技能雷达图 + 分数趋势 + 历史回顾</span></div>
        </div>
      </div>

      <p class="left-foot">覆盖 JS / CSS / React / Vue / Node / 算法 / 工程化 / 系统设计</p>
    </div>

    <!-- 右侧表单 -->
    <div class="right">
      <div class="form-wrap">
        <div class="tabs">
          <button :class="{ on: mode === 'login' }" @click="mode = 'login'; err = ''; ok = ''">登录</button>
          <button :class="{ on: mode === 'register' }" @click="mode = 'register'; err = ''; ok = ''">注册</button>
        </div>

        <div v-if="err" class="msg msg-err">{{ err }}</div>
        <div v-if="ok" class="msg msg-ok">{{ ok }}</div>

        <form @submit.prevent="submit">
          <div class="field">
            <label>邮箱</label>
            <input v-model="email" type="email" placeholder="name@company.com" />
          </div>
          <div class="field">
            <label>密码</label>
            <input v-model="password" type="password" placeholder="至少 6 位" minlength="6" />
          </div>
          <button type="submit" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            <span v-else>{{ mode === 'login' ? '登录' : '创建账号' }}</span>
          </button>
        </form>

        <p class="swap">
          {{ mode === 'login' ? '还没有账号？' : '已有账号？' }}
          <a href="#" @click.prevent="mode = mode === 'login' ? 'register' : 'login'; err = ''; ok = ''">
            {{ mode === 'login' ? '立即注册' : '去登录' }}
          </a>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ====== 布局：全视口，零留白 ====== */
.root {
  display: flex;
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', sans-serif;
  overflow: hidden;
}

/* ====== 左侧 ====== */
.left {
  flex: 1;
  background: #0c0c0e;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 64px 56px 56px;
  color: #fafafa;
  min-width: 0;
}

.left-top { margin-bottom: 48px; }

.logo {
  width: 48px; height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  display: flex; align-items: center; justify-content: center;
  font-size: 24px;
  margin-bottom: 20px;
  box-shadow: 0 8px 24px rgba(79,70,229,.3);
}

.left h1 {
  font-size: 32px; font-weight: 800;
  letter-spacing: -.03em; margin-bottom: 6px;
}

.subtitle {
  font-size: 15px; color: #71717a;
}

/* 功能列表 - 竖向排列填充空间 */
.features {
  display: flex; flex-direction: column; gap: 20px;
  margin-bottom: auto;
}

.ft {
  display: flex; gap: 14px; align-items: flex-start;
}

.ft-icon { font-size: 22px; flex-shrink: 0; margin-top: 1px; }

.ft strong {
  display: block; font-size: 14px; color: #e4e4e7; margin-bottom: 2px; font-weight: 600;
}

.ft span {
  font-size: 13px; color: #52525b; line-height: 1.4;
}

.left-foot {
  margin-top: 48px;
  font-size: 12px; color: #3f3f46;
  letter-spacing: .03em;
}

/* ====== 右侧 ====== */
.right {
  width: 480px;
  flex-shrink: 0;
  background: #18181b;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.form-wrap {
  width: 100%;
  max-width: 360px;
}

/* 切换 */
.tabs {
  display: flex;
  gap: 24px;
  margin-bottom: 28px;
}

.tabs button {
  border: none; background: none;
  font-size: 18px; font-weight: 700; color: #52525b;
  cursor: pointer; font-family: inherit; padding: 0;
  transition: color .15s;
}

.tabs button.on {
  color: #fafafa;
}

/* 消息 */
.msg {
  padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 16px;
}
.msg-err { background: rgba(239,68,68,.08); color: #fca5a5; border: 1px solid rgba(239,68,68,.15); }
.msg-ok  { background: rgba(34,197,94,.08); color: #86efac; border: 1px solid rgba(34,197,94,.15); }

/* 表单 */
form { display: flex; flex-direction: column; gap: 16px; }

.field label {
  display: block; font-size: 12px; font-weight: 600; color: #71717a;
  text-transform: uppercase; letter-spacing: .06em; margin-bottom: 6px;
}

.field input {
  width: 100%; padding: 11px 14px;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 10px;
  font-size: 14px; color: #fafafa; font-family: inherit;
  outline: none;
  transition: border-color .2s;
  box-sizing: border-box;
}
.field input::placeholder { color: #3f3f46; }
.field input:focus { border-color: rgba(79,70,229,.5); }

button[type="submit"] {
  width: 100%; margin-top: 8px; padding: 13px;
  background: #fafafa; border: none; border-radius: 12px;
  font-size: 15px; font-weight: 600; color: #0c0c0e;
  cursor: pointer; font-family: inherit;
  display: flex; align-items: center; justify-content: center;
  min-height: 46px;
}
button[type="submit"]:hover { background: #fff; }
button[type="submit"]:disabled { opacity: .4; cursor: not-allowed; }

/* 底部切换 */
.swap {
  text-align: center; margin-top: 24px;
  font-size: 13px; color: #52525b;
}
.swap a { color: #818cf8; text-decoration: none; font-weight: 500; }
.swap a:hover { text-decoration: underline; }

/* 加载 */
.spinner {
  width: 20px; height: 20px;
  border: 2px solid rgba(0,0,0,.15);
  border-top-color: #0c0c0e;
  border-radius: 50%;
  animation: spin .5s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ====== 响应式 ====== */
@media (max-width: 768px) {
  .root { flex-direction: column-reverse; height: auto; min-height: 100vh; }
  .left { padding: 40px 28px; }
  .left .features { display: none; }
  .left h1 { font-size: 26px; }
  .left-foot { margin-top: 24px; }
  .right { width: 100%; padding: 36px 28px; }
}
</style>
