<script setup>
import { ref } from 'vue'

const emit = defineEmits(['submit'])
const props = defineProps({
  disabled: { type: Boolean, default: false }
})

const answer = ref('')
const isRecording = ref(false)
let recognition = null

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

function toggleVoice() {
  if (isRecording.value) { stopVoice(); return }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) { alert('浏览器不支持语音'); return }
  recognition = new SR()
  recognition.lang = 'zh-CN'
  recognition.interimResults = true
  recognition.continuous = true
  recognition.onresult = (e) => {
    let t = ''
    for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript
    answer.value = t
  }
  recognition.onerror = () => isRecording.value = false
  recognition.onend = () => isRecording.value = false
  recognition.start()
  isRecording.value = true
}

function stopVoice() {
  if (recognition) { recognition.stop(); recognition = null }
  isRecording.value = false
}
</script>

<template>
  <div class="input-bar">
    <textarea
      v-model="answer"
      class="text"
      placeholder="输入你的回答... Enter 发送，Shift+Enter 换行"
      :disabled="disabled"
      rows="2"
      @keydown="handleKeydown"
    ></textarea>
    <div class="actions">
      <button class="mic" :class="{ on: isRecording }" @click="toggleVoice" title="语音输入">
        <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
          <rect x="7" y="2" width="6" height="12" rx="3" stroke="currentColor" stroke-width="1.5"/>
          <path d="M4 10a6 6 0 0012 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="10" y1="16" x2="10" y2="18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
      <button class="send" :disabled="disabled || !answer.trim()" @click="handleSubmit">
        发送
        <svg viewBox="0 0 20 20" fill="none" width="14" height="14">
          <path d="M3 10h13m0 0l-5-5m5 5l-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.input-bar {
  border-top: 1px solid var(--border-color);
  padding: 16px 24px 20px;
  background: var(--bg-card);
}

.text {
  width: 100%;
  padding: 14px 18px;
  border: 1.5px solid var(--border-color);
  border-radius: 14px;
  font-size: 14.5px; line-height: 1.65;
  color: var(--text-primary); background: var(--bg-primary);
  font-family: inherit; resize: none; outline: none;
  transition: border-color .2s, box-shadow .2s;
}
.text:focus {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(79,70,229,.08);
}
.text::placeholder { color: var(--text-muted); }

.actions {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 10px;
}

.mic {
  width: 38px; height: 38px;
  border: 1.5px solid var(--border-color); border-radius: 12px;
  background: var(--bg-card); color: var(--text-secondary);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all .15s;
}
.mic:hover { border-color: var(--accent-color); color: var(--accent-color); }
.mic.on { background: #fef2f2; border-color: #fca5a5; color: #dc2626; animation: pulse 1.2s ease infinite; }
@keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,.2); } 50% { box-shadow: 0 0 0 6px rgba(220,38,38,0); } }

.send {
  padding: 8px 18px;
  border: none; border-radius: 12px;
  background: var(--accent-color); color: #fff;
  font-size: 14px; font-weight: 600; font-family: inherit;
  cursor: pointer; display: flex; align-items: center; gap: 6px;
  transition: background .15s, transform .1s, box-shadow .15s;
  box-shadow: 0 2px 8px rgba(79,70,229,.25);
}
.send:hover:not(:disabled) { background: #4338ca; box-shadow: 0 4px 14px rgba(79,70,229,.35); }
.send:active:not(:disabled) { transform: scale(.97); }
.send:disabled { opacity: .4; cursor: not-allowed; box-shadow: none; }
</style>
