<script setup lang="ts">
type Variant = "recommended" | "discouraged" | "deprecated";

const props = defineProps<{
  variant: Variant;
  text?: string;
}>();

const defaultText: Record<Variant, string> = {
  recommended: "recommended",
  discouraged: "discouraged",
  deprecated: "deprecated",
};
</script>

<template>
  <span class="status-badge ignore-header" :class="variant">{{ text ?? defaultText[props.variant] }}</span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 12px;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  font-weight: 600;
  line-height: 22px;
  padding: 0 10px;
  animation: status-badge-glow 2.2s ease-in-out infinite;
}

/* light mode */
.status-badge.recommended {
  background: linear-gradient(135deg, #a7f3d0, #bae6fd);
  color: #065f46;
  --status-glow: rgba(45, 212, 191, 0.65);
}

.status-badge.discouraged {
  background: #fed7aa;
  color: #9a3412;
  --status-glow: rgba(251, 146, 60, 0.65);
}

.status-badge.deprecated {
  background: #fecaca;
  color: #991b1b;
  --status-glow: rgba(248, 113, 113, 0.7);
}

/* dark mode */
.dark .status-badge.recommended {
  background: linear-gradient(135deg, #065f46, #0369a1);
  color: #d1fae5;
  --status-glow: rgba(45, 212, 191, 0.55);
}

.dark .status-badge.discouraged {
  background: #9a3412;
  color: #fed7aa;
  --status-glow: rgba(251, 146, 60, 0.55);
}

.dark .status-badge.deprecated {
  background: #991b1b;
  color: #fecaca;
  --status-glow: rgba(248, 113, 113, 0.6);
}

@keyframes status-badge-glow {
  0%,
  100% {
    box-shadow: 0 0 3px 0 var(--status-glow);
  }
  50% {
    box-shadow: 0 0 9px 2px var(--status-glow);
  }
}
</style>
