<script setup>
defineProps({
  kind: String,
  title: String,
  subtitle: String,
  artwork: String,
})
</script>

<template>
  <header class="entity">
    <img v-if="artwork" :src="artwork" alt="" />
    <div class="ph" v-else>{{ title?.[0] }}</div>
    <div class="txt">
      <span class="kind">{{ kind }}</span>
      <h2>{{ title }}</h2>
      <span class="muted">{{ subtitle }}</span>
    </div>
    <div class="actions"><slot /></div>
  </header>
</template>

<style scoped>
.entity { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
img, .ph { width: 88px; height: 88px; border-radius: 10px; object-fit: cover; box-shadow: var(--shadow); }
.ph { display: grid; place-items: center; background: var(--surface-2); font-size: 34px; font-weight: 700; color: var(--text-3); }
.txt { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 200px; }
.kind { text-transform: uppercase; letter-spacing: 0.08em; font-size: 11px; color: var(--text-3); font-weight: 600; }
.actions { display: flex; gap: 8px; }
</style>
