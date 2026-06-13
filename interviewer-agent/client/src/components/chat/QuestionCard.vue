<script setup>
// QuestionCard 在当前架构中用于展示当前问题（ChatPanel已内联处理）
// 保留为独立组件，供未来扩展
defineProps({
  question: { type: Object, default: () => ({}) }
})
</script>

<template>
  <div class="question-card">
    <div class="question-text">{{ question.text }}</div>
  </div>
</template>

<style scoped>
.question-card {
  background: var(--bg-card);
  border: 2px solid var(--accent-color);
  border-radius: var(--radius-lg);
  padding: 20px;
  margin-bottom: 16px;
}
.question-text {
  font-size: 15px;
  line-height: 1.8;
}
</style>
