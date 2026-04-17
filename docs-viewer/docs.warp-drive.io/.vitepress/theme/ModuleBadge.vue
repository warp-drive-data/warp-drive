<script setup lang="ts">
defineProps<{
  path: string;
}>();
</script>

<template>
  <span class="module-badge">
    <span class="module-badge-label">module</span>
    <span class="module-badge-path">{{ path }}</span>
  </span>
</template>

<style scoped>
.module-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 12px;
  overflow: hidden;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  font-weight: 500;
  line-height: 22px;
  border: 1px solid transparent;
  transform: translateY(-2px);
}

/* light mode */
.module-badge-label {
  background: #99f6e4;
  color: #0f766e;
  padding: 0 8px;
  font-weight: 600;
}

.module-badge-path {
  background: #d3e1f5;
  color: #374559;
  padding: 0 10px;
}

/* dark mode */
.dark .module-badge-label {
  background: #0f766e;
  color: #ccfbf1;
}

.dark .module-badge-path {
  background: #334155;
  color: #cbd5e1;
}
</style>
