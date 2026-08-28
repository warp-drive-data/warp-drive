<script setup lang="ts">
defineProps<{
  version: string;
}>();
</script>

<template>
  <span class="since-badge">
    <span class="since-badge-label">since</span>
    <span class="since-badge-version">v{{ version }}</span>
  </span>
</template>

<style scoped>
.since-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 12px;
  overflow: hidden;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  font-weight: 500;
  line-height: 22px;
  border: 1px solid transparent;
}

/* light mode */
.since-badge-label {
  background: #fde68a;
  color: #92400e;
  padding: 0 8px;
  font-weight: 600;
}

.since-badge-version {
  background: #d3e1f5;
  color: #374559;
  padding: 0 10px;
}

/* dark mode */
.dark .since-badge-label {
  background: #92400e;
  color: #fef3c7;
}

.dark .since-badge-version {
  background: #334155;
  color: #cbd5e1;
}
</style>
