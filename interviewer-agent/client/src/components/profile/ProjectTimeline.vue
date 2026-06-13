<script setup>
defineProps({
  projects: { type: Array, default: () => [] }
})
</script>

<template>
  <div class="project-timeline">
    <div v-if="!projects.length" class="empty-state">
      <div class="empty-state-text">暂无项目经验</div>
    </div>
    <div v-else class="timeline">
      <div v-for="(proj, idx) in projects" :key="idx" class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-content">
          <div class="timeline-header">
            <h4>{{ proj.name || '未命名项目' }}</h4>
            <span v-if="proj.duration" class="timeline-date">{{ proj.duration }}</span>
          </div>
          <p v-if="proj.description" class="timeline-desc">{{ proj.description }}</p>
          <div v-if="proj.techUsed?.length" class="timeline-tags">
            <span
              v-for="tech in (Array.isArray(proj.techUsed) ? proj.techUsed : proj.techUsed.split(','))"
              :key="tech"
              class="tag"
            >{{ tech.trim() }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline {
  position: relative;
  padding-left: 24px;
}
.timeline::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, var(--accent-color), var(--border-color));
}
.timeline-item {
  position: relative;
  margin-bottom: 24px;
}
.timeline-item:last-child { margin-bottom: 0; }
.timeline-dot {
  position: absolute;
  left: -21px;
  top: 8px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent-color);
  border: 2px solid var(--bg-card);
  box-shadow: 0 0 0 2px var(--accent-color);
}
.timeline-content {
  padding: 14px 16px;
  background: var(--bg-hover);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}
.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.timeline-header h4 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}
.timeline-date {
  font-size: 12px;
  color: var(--text-muted);
  flex-shrink: 0;
  margin-left: 12px;
}
.timeline-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 6px 0;
  line-height: 1.5;
}
.timeline-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}
</style>
