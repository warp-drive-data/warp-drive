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
  border-radius: 4px;
  overflow: hidden;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1;
}

.module-badge-label {
  background: #c89a1a;
  color: #1a1200;
  padding: 4px 8px;
  font-weight: 600;
}

.module-badge-path {
  background: #3a3a3a;
  color: #e8e8e8;
  padding: 4px 10px;
}
</style>
