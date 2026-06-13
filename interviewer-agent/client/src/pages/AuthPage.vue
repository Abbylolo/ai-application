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
    <div class="left">
      <div>
        <div class="logo">🤖</div>
        <h1>面试官 Agent</h1>
        <p class="sub">AI 驱动的模拟技术面试平台</p>
      </div>

      <div class="grid">
        <div class="item">
          <div class="n">01</div>
          <strong>真实面试模拟</strong>
          <span>大厂 / 中厂 / 小厂三种难度，智能追问策略，还原真实面试压力</span>
        </div>
        <div class="item">
          <div class="n">02</div>
          <strong>即时评估反馈</strong>
          <span>每题评分 + 标准答案 + 薄弱点分析 + 个性化学习建议</span>
        </div>
        <div class="item">
          <div class="n">03</div>
          <strong>公司定制面试</strong>
          <span>上传 JD 精准匹配岗位要求，已支持 字节/阿里/腾讯 等公司</span>
        </div>
        <div class="item">
          <div class="n">04</div>
          <strong>简历智能解析</strong>
          <span>上传 PDF 自动提取技能画像，面试题目贴合你的技术背景</span>
        </div>
        <div class="item">
          <div class="n">05</div>
          <strong>数据统计分析</strong>
          <span>技能雷达图 + 分数趋势 + 高频薄弱点，追踪成长轨迹</span>
        </div>
        <div class="item">
          <div class="n">06</div>
          <strong>面试历史回顾</strong>
          <span>逐题回放 + 标记复习，重要题目不再遗忘</span>
        </div>
      </div>

      <p class="tags">
        覆盖 JavaScript · CSS · React · Vue · Node.js · 算法 · 网络 · 工程化 · 系统设计
      </p>
    </div>

    <div class="right">
      <div class="form">
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

        <p class="switch-link">
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
/* ========== 全视口布局 ========== */
.root {
  display: flex;
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', sans-serif;
}

/* ========== 左侧 ========== */
.left {
  flex: 1;
  background: #0c0c0e;
  display: flex;
  flex-direction: column;
  padding: 56px 52px 40px;
  color: #fafafa;
  gap: 0;
}

.logo {
  width: 44px; height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
  margin-bottom: 16px;
  box-shadow: 0 8px 24px rgba(79,70,229,.3);
}

.left h1 {
  font-size: 30px; font-weight: 800;
  letter-spacing: -.03em; margin-bottom: 4px;
}

.sub {
  font-size: 15px; color: #71717a;
}

/* 6宫格功能 */
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px 36px;
  margin: auto 0;
  padding: 24px 0;
}

.item .n {
  font-size: 11px; font-weight: 700; color: #4f46e5;
  letter-spacing: .08em; margin-bottom: 4px;
}

.item strong {
  display: block; font-size: 14px; color: #e4e4e7;
  margin-bottom: 3px; font-weight: 600;
}

.item span {
  font-size: 12px; color: #52525b; line-height: 1.5;
  display: block;
}

.tags {
  font-size: 12px; color: #3f3f46;
  letter-spacing: .03em;
  padding-top: 8px;
}

/* ========== 右侧 ========== */
.right {
  width: 460px; flex-shrink: 0;
  background: #18181b;
  padding: 48px 44px;
  display: flex; flex-direction: column;
  justify-content: space-between;
}

.form {
  width: 100%;
}

.tabs {
  display: flex; gap: 24px; margin-bottom: 28px;
}

.tabs button {
  border: none; background: none;
  font-size: 18px; font-weight: 700; color: #52525b;
  cursor: pointer; font-family: inherit; padding: 0;
  transition: color .15s;
}
.tabs button.on { color: #fafafa; }

.alert {
  padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 16px;
}
.alert-err { background: rgba(239,68,68,.08); color: #fca5a5; border: 1px solid rgba(239,68,68,.15); }
.alert-ok  { background: rgba(34,197,94,.08); color: #86efac; border: 1px solid rgba(34,197,94,.15); }

form { display: flex; flex-direction: column; gap: 14px; flex: 1; justify-content: center; padding: 24px 0; }

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
  width: 100%; margin-top: 8px; padding: 13px;
  background: #fafafa; border: none; border-radius: 12px;
  font-size: 15px; font-weight: 600; color: #0c0c0e;
  cursor: pointer; font-family: inherit;
  display: flex; align-items: center; justify-content: center;
  min-height: 46px;
}
button[type="submit"]:hover { background: #fff; }
button[type="submit"]:disabled { opacity: .4; cursor: not-allowed; }

.switch-link {
  text-align: center; margin-top: 22px;
  font-size: 13px; color: #52525b;
}
.switch-link a { color: #818cf8; text-decoration: none; font-weight: 500; }

.spin {
  width: 20px; height: 20px;
  border: 2px solid rgba(0,0,0,.15);
  border-top-color: #0c0c0e;
  border-radius: 50%;
  animation: spin .5s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .root { flex-direction: column-reverse; height: auto; min-height: 100vh; }
  .left { padding: 40px 28px; }
  .grid { grid-template-columns: 1fr; gap: 16px; }
  .right { width: 100%; padding: 36px 28px; }
}
</style>
