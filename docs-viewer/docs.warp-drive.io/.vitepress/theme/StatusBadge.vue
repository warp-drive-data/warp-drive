<script setup lang="ts">
type Variant =
  | "recommended"
  | "discouraged"
  | "deprecated"
  | "proposed"
  | "exploring"
  | "accepted"
  | "ready-for-release"
  | "released"
  | "closed";

const props = defineProps<{
  variant: Variant;
  text?: string;
}>();

const defaultText: Record<Variant, string> = {
  recommended: "recommended",
  discouraged: "discouraged",
  deprecated: "deprecated",
  proposed: "proposed",
  exploring: "exploring",
  accepted: "accepted",
  "ready-for-release": "ready for release",
  released: "released",
  closed: "closed",
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

/* RFC stages (light mode) */
.status-badge.proposed {
  background: #e2e8f0;
  color: #334155;
  --status-glow: rgba(148, 163, 184, 0.6);
}

.status-badge.exploring {
  background: #fef08a;
  color: #854d0e;
  --status-glow: rgba(250, 204, 21, 0.65);
}

.status-badge.accepted {
  background: #bbf7d0;
  color: #166534;
  --status-glow: rgba(74, 222, 128, 0.65);
}

.status-badge.ready-for-release {
  background: #bfdbfe;
  color: #1e40af;
  --status-glow: rgba(96, 165, 250, 0.65);
}

.status-badge.released {
  background: #e9d5ff;
  color: #6b21a8;
  --status-glow: rgba(192, 132, 252, 0.65);
}

.status-badge.closed {
  background: #fecaca;
  color: #991b1b;
  --status-glow: rgba(248, 113, 113, 0.6);
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

/* RFC stages (dark mode) */
.dark .status-badge.proposed {
  background: #334155;
  color: #e2e8f0;
  --status-glow: rgba(148, 163, 184, 0.5);
}

.dark .status-badge.exploring {
  background: #854d0e;
  color: #fef08a;
  --status-glow: rgba(250, 204, 21, 0.55);
}

.dark .status-badge.accepted {
  background: #166534;
  color: #bbf7d0;
  --status-glow: rgba(74, 222, 128, 0.55);
}

.dark .status-badge.ready-for-release {
  background: #1e40af;
  color: #bfdbfe;
  --status-glow: rgba(96, 165, 250, 0.55);
}

.dark .status-badge.released {
  background: #6b21a8;
  color: #e9d5ff;
  --status-glow: rgba(192, 132, 252, 0.55);
}

.dark .status-badge.closed {
  background: #991b1b;
  color: #fecaca;
  --status-glow: rgba(248, 113, 113, 0.5);
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
