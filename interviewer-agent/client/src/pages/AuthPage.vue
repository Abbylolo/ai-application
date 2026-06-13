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
  if (password.value.length < 6) {
    errorMsg.value = '密码至少6位'
    return
  }

  isLoading.value = true
  try {
    if (isRegister.value) {
      const data = await signUp(email.value, password.value)
      if (data.user?.identities?.length === 0) {
        errorMsg.value = '该邮箱已注册，请直接登录'
      } else {
        successMsg.value = '注册成功！无需验证，直接点击下方"已有账号？去登录"登录'
      }
    } else {
      await signIn(email.value, password.value)
      router.push('/')
    }
  } catch (err) {
    errorMsg.value = err.message === 'Invalid login credentials'
      ? '邮箱或密码错误'
      : (err.message || '操作失败')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="auth-layout">
    <!-- 左侧品牌区 -->
    <div class="auth-left">
      <div class="auth-brand">
        <div class="brand-logo">🤖</div>
        <h1>面试官 Agent</h1>
        <p class="brand-desc">AI 驱动的模拟技术面试平台</p>
      </div>

      <div class="feature-list">
        <div class="feature-item">
          <span class="feature-icon">🎯</span>
          <div>
            <strong>真实模拟</strong>
            <p>大厂/中厂/小厂三种难度，不同追问策略，还原真实面试压力</p>
          </div>
        </div>
        <div class="feature-item">
          <span class="feature-icon">📊</span>
          <div>
            <strong>智能评估</strong>
            <p>每题即时评分 + 标准答案，薄弱点分析 + 学习建议</p>
          </div>
        </div>
        <div class="feature-item">
          <span class="feature-icon">🏢</span>
          <div>
            <strong>公司定制</strong>
            <p>上传 JD，针对目标公司精准出题，面经题库积累</p>
          </div>
        </div>
        <div class="feature-item">
          <span class="feature-icon">📝</span>
          <div>
            <strong>简历解析</strong>
            <p>上传简历自动提取技能画像，面试题目贴合背景</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧登录区 -->
    <div class="auth-right">
      <div class="auth-form-card">
        <div class="form-header">
          <h2>{{ isRegister ? '创建账号' : '欢迎回来' }}</h2>
          <p class="text-secondary">{{ isRegister ? '注册后免费使用全部功能' : '登录你的账号继续面试' }}</p>
        </div>

        <div v-if="errorMsg" class="error-message">{{ errorMsg }}</div>
        <div v-if="successMsg" class="success-message">{{ successMsg }}</div>

        <form @submit.prevent="handleSubmit" class="auth-form">
          <div class="form-group">
            <label class="form-label">邮箱</label>
            <input
              v-model="email"
              type="email"
              class="form-input form-input-lg"
              placeholder="your@email.com"
              autocomplete="email"
            />
          </div>
          <div class="form-group">
            <label class="form-label">密码</label>
            <input
              v-model="password"
              type="password"
              class="form-input form-input-lg"
              placeholder="至少6位"
              minlength="6"
              autocomplete="current-password"
            />
          </div>

          <button type="submit" class="btn btn-primary btn-block btn-auth" :disabled="isLoading">
            {{ isLoading ? '处理中...' : (isRegister ? '注册' : '登录') }}
          </button>
        </form>

        <div class="form-divider">
          <span>or</span>
        </div>

        <button class="btn btn-block btn-ghost" @click="isRegister = !isRegister; errorMsg = ''; successMsg = ''">
          {{ isRegister ? '已有账号？去登录 →' : '没有账号？去注册 →' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-layout {
  display: flex;
  min-height: 100vh;
}

/* ====== 左侧品牌区 ====== */
.auth-left {
  flex: 1;
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
  color: #e0e7ff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 60px 48px;
}

.auth-brand {
  margin-bottom: 48px;
}

.brand-logo {
  font-size: 56px;
  margin-bottom: 12px;
}

.auth-brand h1 {
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 8px;
}

.brand-desc {
  font-size: 15px;
  color: #a5b4fc;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.feature-item {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.feature-icon {
  font-size: 28px;
  flex-shrink: 0;
  margin-top: 2px;
}

.feature-item strong {
  display: block;
  font-size: 14px;
  color: #ffffff;
  margin-bottom: 2px;
}

.feature-item p {
  font-size: 13px;
  color: #a5b4fc;
  line-height: 1.5;
  margin: 0;
}

/* ====== 右侧登录区 ====== */
.auth-right {
  width: 460px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: var(--bg-primary);
}

.auth-form-card {
  width: 100%;
  max-width: 380px;
}

.form-header {
  text-align: center;
  margin-bottom: 28px;
}

.form-header h2 {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 6px;
  color: var(--text-primary);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-input-lg {
  padding: 10px 14px;
  font-size: 15px;
  border-radius: var(--radius-md);
}

.btn-auth {
  margin-top: 8px;
  padding: 12px;
  font-size: 15px;
  border-radius: var(--radius-md);
}

.form-divider {
  display: flex;
  align-items: center;
  margin: 20px 0;
  color: var(--text-muted);
}

.form-divider::before,
.form-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-color);
}

.form-divider span {
  padding: 0 12px;
  font-size: 13px;
}

/* ====== 响应式 ====== */
@media (max-width: 768px) {
  .auth-layout {
    flex-direction: column;
  }
  .auth-left {
    padding: 40px 24px;
    min-height: auto;
  }
  .auth-left .feature-list {
    display: none;
  }
  .auth-right {
    width: 100%;
    padding: 32px 24px;
    flex: 1;
  }
}
</style>
