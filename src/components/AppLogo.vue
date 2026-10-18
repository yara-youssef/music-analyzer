<script setup>
defineProps({ size: { type: Number, default: 26 } })
</script>

<template>
  <!-- Speech bubble (lyrics) holding equalizer bars (analysis). Mirrors public/favicon.svg. -->
  <svg :width="size" :height="size" viewBox="0 0 32 32" aria-hidden="true" class="logo">
    <path d="M9 3h14a6 6 0 0 1 6 6v10a6 6 0 0 1-6 6H15l-6 5v-5a6 6 0 0 1-6-6V9a6 6 0 0 1 6-6z" class="bubble" />
    <rect x="9" y="12" width="3.2" height="8" rx="1.6" class="bar" />
    <rect x="14.4" y="7.5" width="3.2" height="12.5" rx="1.6" class="bar" />
    <rect x="19.8" y="10.5" width="3.2" height="9.5" rx="1.6" class="bar" />
  </svg>
</template>

<style scoped>
.logo { flex: none; }
.bubble { fill: var(--accent); }
.bar { fill: var(--accent-ink); }
</style>
