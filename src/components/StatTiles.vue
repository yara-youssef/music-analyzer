<script setup>
defineProps({ stats: { type: Array, required: true } }) // [{ label, value, hint }]
</script>

<template>
  <div class="tiles">
    <div v-for="s in stats" :key="s.label" class="tile" :title="s.hint">
      <div class="value">{{ s.value }}</div>
      <div class="label">{{ s.label }}</div>
      <div v-if="s.hint" class="hint">{{ s.hint }}</div>
    </div>
  </div>
</template>

<style scoped>
.tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
.tile { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 16px; }
.value { font-size: 26px; font-weight: 650; font-variant-numeric: tabular-nums; letter-spacing: -0.01em; }
.label { color: var(--text-2); font-size: 13px; font-weight: 500; }
.hint { color: var(--text-3); font-size: 12px; margin-top: 2px; }
</style>
