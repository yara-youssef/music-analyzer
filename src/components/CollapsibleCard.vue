<script setup>
import { ref, watch } from 'vue'

// A card whose body folds away. The open/closed choice is remembered per
// `storageKey`, so a section someone collapsed stays collapsed next time.
const props = defineProps({
  title: { type: String, required: true },
  sub: { type: String, default: '' },
  storageKey: { type: String, required: true },
})

const key = `collapsed:${props.storageKey}`
function load() {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}
const collapsed = ref(load())
watch(collapsed, (v) => {
  try {
    v ? localStorage.setItem(key, '1') : localStorage.removeItem(key)
  } catch {
    /* storage unavailable: still works for this visit */
  }
})
const bodyId = `cc-${props.storageKey}`
</script>

<template>
  <div class="card collapsible" :class="{ collapsed }">
    <div class="card-head">
      <button class="toggle" :aria-expanded="!collapsed" :aria-controls="bodyId" @click="collapsed = !collapsed">
        <svg class="chev" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <h3>{{ title }}</h3>
        <span v-if="sub" class="card-sub">{{ sub }}</span>
      </button>
      <div v-if="!collapsed" class="actions"><slot name="actions" /></div>
    </div>
    <div v-show="!collapsed" :id="bodyId"><slot /></div>
  </div>
</template>

<style scoped>
.collapsible.collapsed .card-head { margin-bottom: 0; }
.toggle {
  display: flex; align-items: baseline; gap: 8px; background: none; border: 0; padding: 2px 6px 2px 2px;
  margin: -2px 0 -2px -2px; border-radius: 6px; cursor: pointer; text-align: left; min-width: 0;
}
.toggle:hover { background: var(--surface-2); }
.chev { align-self: center; color: var(--text-3); transition: transform 0.15s; flex: none; }
.collapsed .chev { transform: rotate(-90deg); }
.actions { display: flex; align-items: center; gap: 8px; }
</style>
