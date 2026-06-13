<script setup>
import { ref, nextTick } from 'vue'

const emit = defineEmits(['submit'])
const props = defineProps({
  disabled: { type: Boolean, default: false },
  placeholder: { type: String, default: '输入你的回答... (Enter 发送，Shift+Enter 换行)' }
})

const answer = ref('')
const isRecording = ref(false)

function handleSubmit() {
  if (!answer.value.trim() || props.disabled) return
  emit('submit', answer.value.trim())
  answer.value = ''
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSubmit()
  }
}

// 语音输入（Web Speech API）
let recognition = null

function toggleVoice() {
  if (isRecording.value) {
    stopVoice()
    return
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    alert('您的浏览器不支持语音识别，请使用 Chrome')
    return
  }

  recognition = new SpeechRecognition()
  recognition.lang = 'zh-CN'
  recognition.interimResults = true
  recognition.continuous = true

  recognition.onresult = (event) => {
    let transcript = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript
    }
    answer.value = transcript
  }

  recognition.onerror = (event) => {
    console.error('语音识别错误:', event.error)
    isRecording.value = false
  }

  recognition.onend = () => {
    isRecording.value = false
  }

  recognition.start()
  isRecording.value = true
}

function stopVoice() {
  if (recognition) {
    recognition.stop()
    recognition = null
  }
  isRecording.value = false
}
</script>

<template>
  <div class="answer-input-container">
    <textarea
      v-model="answer"
      class="answer-textarea"
      :placeholder="placeholder"
      :disabled="disabled"
      rows="3"
      @keydown="handleKeydown"
    ></textarea>
    <div class="answer-actions">
      <button
        class="btn btn-ghost btn-sm"
        :class="{ 'btn-recording': isRecording }"
        @click="toggleVoice"
        :title="isRecording ? '停止录音' : '语音输入'"
      >
        {{ isRecording ? '🔴 录音中...' : '🎤 语音' }}
      </button>
      <button
        class="btn btn-primary"
        :disabled="disabled || !answer.trim()"
        @click="handleSubmit"
      >
        📤 提交回答
      </button>
    </div>
  </div>
</template>

<style scoped>
.answer-input-container {
  border-top: 1px solid var(--border-color);
  padding: 16px 20px;
  background: var(--bg-card);
}

.answer-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-input);
  border-radius: var(--radius-md);
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  font-family: inherit;
  background: var(--bg-input);
  color: var(--text-primary);
  transition: border-color 0.15s;
}
.answer-textarea:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.answer-actions {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 8px;
}

.btn-recording {
  color: var(--danger) !important;
  animation: pulse-rec 1.5s ease infinite;
}
@keyframes pulse-rec {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
