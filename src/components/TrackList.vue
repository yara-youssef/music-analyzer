<script setup>
import { computed } from 'vue'
import { inCompare, toggleCompare, addToCompare } from '@/store.js'

const props = defineProps({ tracks: { type: Array, required: true } })
const emit = defineEmits(['open'])
const ready = computed(() => props.tracks.filter((t) => t.status === 'ok'))
const fmtTime = (s) => (s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '')
</script>

<template>
  <div>
    <div class="row head">
      <span class="faint">{{ ready.length }} of {{ tracks.length }} with lyrics</span>
      <button class="btn small" :disabled="!ready.length" @click="ready.forEach(addToCompare)">Add all to compare</button>
    </div>
    <ol class="tracks">
      <li v-for="t in tracks" :key="t.id" :class="{ off: t.status !== 'ok' && t.status !== 'loading' }">
        <button class="title" @click="emit('open', t)">
          <span>{{ t.title }}</span>
          <span class="faint">{{ fmtTime(t.durationSec) }}</span>
        </button>
        <span class="status">
          <span v-if="t.status === 'loading'" class="spinner" aria-label="loading lyrics"></span>
          <span v-else-if="t.status === 'missing'" class="faint">no lyrics found</span>
          <span v-else-if="t.status === 'instrumental'" class="faint">instrumental</span>
        </span>
        <button
          class="btn small"
          :class="{ on: inCompare(t.id) }"
          :disabled="t.status !== 'ok'"
          @click="toggleCompare(t)"
          :title="inCompare(t.id) ? 'Remove from compare' : 'Add to compare'"
        >{{ inCompare(t.id) ? '✓ Comparing' : '+ Compare' }}</button>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.head { justify-content: space-between; margin-bottom: 8px; }
.tracks { list-style: none; margin: 0; padding: 0; counter-reset: t; max-height: 520px; overflow: auto; }
.tracks li { display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px solid var(--border); counter-increment: t; }
.tracks li::before { content: counter(t); width: 22px; color: var(--text-3); font-size: 12px; text-align: right; font-variant-numeric: tabular-nums; }
.tracks li.off .title span:first-child { color: var(--text-3); }
.title { flex: 1; display: flex; justify-content: space-between; gap: 8px; background: none; border: 0; padding: 4px 6px; border-radius: 6px; text-align: left; cursor: pointer; min-width: 0; }
.title:hover { background: var(--surface-2); }
.title span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.status { min-width: 16px; }
</style>
