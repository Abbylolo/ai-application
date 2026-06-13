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
      <div class="left-inner">
        <div>
          <div class="logo-row">
            <div class="logo">🤖</div>
            <span class="logo-text">InterviewAgent</span>
          </div>
          <h1>模拟真实面试<br>精准提升技术能力</h1>
          <p class="desc">基于 AI 大模型的智能面试训练平台，覆盖大厂、中厂、小厂面试场景，助你从容应对每一次技术面试。</p>
        </div>

        <div class="stats">
          <div class="stat"><strong>3</strong><span>难度等级</span></div>
          <div class="stat"><strong>200+</strong><span>高频考题</span></div>
          <div class="stat"><strong>10+</strong><span>技术领域</span></div>
        </div>

        <div class="highlights">
          <div class="hl">
            <div class="hl-icon">🎯</div>
            <div class="hl-text"><strong>真实面试模拟</strong><span>AI 面试官根据你的背景动态出题，智能追问，还原高压面试场景</span></div>
          </div>
          <div class="hl">
            <div class="hl-icon">⚡</div>
            <div class="hl-text"><strong>即时评估反馈</strong><span>每题评分 + 标准答案 + 薄弱点分析，面试结束自动生成报告</span></div>
          </div>
          <div class="hl">
            <div class="hl-icon">🏢</div>
            <div class="hl-text"><strong>公司定制面试</strong><span>上传 JD 精准匹配岗位要求，针对字节、阿里、腾讯等公司定向训练</span></div>
          </div>
        </div>
      </div>
    </div>

    <div class="right">
      <div class="card">
        <div class="tabs">
          <button :class="{ on: mode === 'login' }" @click="mode = 'login'; err = ''; ok = ''">登录</button>
          <button :class="{ on: mode === 'register' }" @click="mode = 'register'; err = ''; ok = ''">注册</button>
        </div>

        <div v-if="err" class="msg msg-err">{{ err }}</div>
        <div v-if="ok" class="msg msg-ok">{{ ok }}</div>

        <form @submit.prevent="submit">
          <label>邮箱地址</label>
          <input v-model="email" type="email" placeholder="name@company.com" />
          <label>密码</label>
          <input v-model="password" type="password" placeholder="至少 6 位" minlength="6" />
          <button type="submit" :disabled="loading">
            <span v-if="loading" class="spin"></span>
            <span v-else>{{ mode === 'login' ? '登录' : '创建账号' }}</span>
          </button>
        </form>

        <p class="foot">
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
.root {
  display: flex;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', sans-serif;
  background: linear-gradient(160deg, #f8fafc 0%, #f1f5f9 40%, #eef2ff 100%);
}

/* ====== 左侧 70% ====== */
.left {
  flex: 7;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 64px;
}

.left-inner {
  max-width: 560px;
}

.logo-row {
  display: flex; align-items: center; gap: 10px; margin-bottom: 36px;
}

.logo {
  width: 40px; height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
}

.logo-text {
  font-size: 16px; font-weight: 700; color: #1e293b;
  letter-spacing: -.01em;
}

.left h1 {
  font-size: 36px; font-weight: 800; color: #0f172a;
  line-height: 1.25; letter-spacing: -.03em; margin-bottom: 16px;
}

.desc {
  font-size: 15px; color: #64748b; line-height: 1.7;
}

/* 数据 */
.stats {
  display: flex; gap: 48px;
  margin: 36px 0;
  padding: 24px 0;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}

.stat strong {
  display: block; font-size: 28px; font-weight: 800;
  color: #4f46e5; letter-spacing: -.02em;
}

.stat span {
  font-size: 13px; color: #94a3b8; margin-top: 2px; display: block;
}

/* 亮点 */
.highlights {
  display: flex; flex-direction: column; gap: 20px;
}

.hl {
  display: flex; gap: 14px; align-items: flex-start;
}

.hl-icon {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0,0,0,.04);
}

.hl-text strong {
  display: block; font-size: 14px; color: #1e293b; margin-bottom: 3px;
}

.hl-text span {
  font-size: 13px; color: #94a3b8; line-height: 1.5;
}

/* ====== 右侧 30% ====== */
.right {
  flex: 3;
  display: flex; align-items: center; justify-content: center;
  padding: 40px;
}

.card {
  width: 100%; max-width: 400px;
  background: #fff;
  border-radius: 20px;
  padding: 44px 36px;
  box-shadow: 0 1px 3px rgba(0,0,0,.04), 0 12px 40px rgba(0,0,0,.06);
}

.tabs {
  display: flex; gap: 28px; margin-bottom: 32px;
}

.tabs button {
  border: none; background: none;
  font-size: 20px; font-weight: 700; color: #94a3b8;
  cursor: pointer; font-family: inherit; padding: 0;
  letter-spacing: -.02em;
}
.tabs button.on { color: #0f172a; }

.msg {
  padding: 12px 16px; border-radius: 10px; font-size: 14px; margin-bottom: 20px;
}
.msg-err { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.msg-ok  { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }

form { display: flex; flex-direction: column; gap: 16px; }

label {
  font-size: 13px; font-weight: 600; color: #475569;
}

input {
  width: 100%; padding: 12px 16px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 15px; color: #0f172a; font-family: inherit; outline: none;
  box-sizing: border-box;
  transition: border-color .15s, box-shadow .15s;
}
input::placeholder { color: #cbd5e1; }
input:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,.08); }

button[type="submit"] {
  width: 100%; margin-top: 8px; padding: 13px;
  background: #4f46e5; border: none; border-radius: 10px;
  font-size: 16px; font-weight: 600; color: #fff;
  cursor: pointer; font-family: inherit;
  display: flex; align-items: center; justify-content: center;
  min-height: 48px;
  transition: background .15s;
}
button[type="submit"]:hover { background: #4338ca; }
button[type="submit"]:disabled { opacity: .5; cursor: not-allowed; }

.foot {
  text-align: center; margin-top: 24px;
  font-size: 14px; color: #94a3b8;
}
.foot a { color: #4f46e5; text-decoration: none; font-weight: 600; }
.foot a:hover { text-decoration: underline; }

.spin {
  width: 20px; height: 20px;
  border: 2px solid rgba(255,255,255,.25);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .5s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 900px) {
  .root { flex-direction: column; }
  .left { flex: auto; padding: 48px 32px; }
  .left h1 { font-size: 28px; }
  .stats { gap: 32px; }
  .right { flex: auto; padding: 24px 32px 48px; }
  .card { max-width: 100%; }
}
</style>
