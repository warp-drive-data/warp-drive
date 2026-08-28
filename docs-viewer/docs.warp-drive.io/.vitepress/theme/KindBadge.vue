<script setup lang="ts">
defineProps<{
  kind: string;
}>();
</script>

<template>
  <span class="kind-badge">{{ kind }}</span>
</template>

<style scoped>
.kind-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 12px;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  font-weight: 600;
  line-height: 22px;
  padding: 0 10px;
  vertical-align: middle;
  background: #ddd6fe;
  color: #5b21b6;
}

.dark .kind-badge {
  background: #5b21b6;
  color: #ede9fe;
}
</style>
