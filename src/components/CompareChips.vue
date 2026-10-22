<script setup>
import { ref } from 'vue'
import { store, removeFromCompare, moveInCompare } from '@/store.js'

// The compare list as chips that can be reordered by dragging. A mouse can
// grab a chip anywhere; touch drags start on the grip so swiping still
// scrolls the page. Arrow keys on the grip move a chip too.
const dragId = ref(null)
const chipsEl = ref(null)

function onPointerDown(e, id) {
  if (e.button !== 0 || e.target.closest('.x')) return
  if (e.pointerType !== 'mouse' && !e.target.closest('.grip')) return
  e.preventDefault()
  dragId.value = id
  e.currentTarget.setPointerCapture(e.pointerId)
}

function onPointerMove(e) {
  if (!dragId.value) return
  const over = document.elementFromPoint(e.clientX, e.clientY)?.closest('.chip')
  if (!over || !chipsEl.value.contains(over) || over.dataset.id === dragId.value) return
  const from = store.compare.findIndex((s) => s.id === dragId.value)
  const target = store.compare.findIndex((s) => s.id === over.dataset.id)
  // Only swap past the target's midpoint, so chips of different widths don't flip back and forth.
  const r = over.getBoundingClientRect()
  const sameRow = e.clientY >= r.top && e.clientY <= r.bottom
  const pastMid = target > from ? e.clientX > r.left + r.width / 2 : e.clientX < r.left + r.width / 2
  if (!sameRow || pastMid) moveInCompare(from, target)
}

function onPointerUp() {
  dragId.value = null
}

function onKey(e, i) {
  const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.key]
  if (!step) return
  e.preventDefault()
  moveInCompare(i, i + step)
  // Keep focus on the moved chip's grip so repeated presses keep moving it.
  requestAnimationFrame(() => chipsEl.value.querySelectorAll('.grip')[Math.max(0, Math.min(store.compare.length - 1, i + step))]?.focus())
}
</script>

<template>
  <div ref="chipsEl" class="chips" :class="{ dragging: dragId }">
    <span
      v-for="(s, i) in store.compare"
      :key="s.id"
      :data-id="s.id"
      class="chip"
      :class="{ lifted: dragId === s.id }"
      @pointerdown="onPointerDown($event, s.id)"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <button
        v-if="store.compare.length > 1"
        class="grip"
        :aria-label="`Move ${s.title} (position ${i + 1} of ${store.compare.length}); use arrow keys`"
        title="Drag to reorder"
        @keydown="onKey($event, i)"
      >
        <svg width="10" height="16" viewBox="0 0 10 16" aria-hidden="true">
          <g fill="currentColor"><circle cx="3" cy="3" r="1.4" /><circle cx="7" cy="3" r="1.4" /><circle cx="3" cy="8" r="1.4" />
            <circle cx="7" cy="8" r="1.4" /><circle cx="3" cy="13" r="1.4" /><circle cx="7" cy="13" r="1.4" /></g>
        </svg>
      </button>
      <img v-if="s.artwork" :src="s.artwork" alt="" draggable="false" />
      <span class="chip-txt"><b>{{ s.title }}</b><span class="faint">{{ s.artist }}</span></span>
      <button class="x" @click="removeFromCompare(s.id)" :aria-label="`Remove ${s.title}`">×</button>
    </span>
  </div>
  <p v-if="store.compare.length > 1" class="faint hint">Drag songs to change their order in the comparison.</p>
</template>

<style scoped>
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip {
  display: inline-flex; align-items: center; gap: 6px; padding: 4px; border: 1px solid var(--border);
  border-radius: 10px; background: var(--surface-2); max-width: 280px; user-select: none;
  transition: box-shadow 0.15s, transform 0.15s, opacity 0.15s;
}
@media (hover: hover) { .chip { cursor: grab; } }
.dragging, .dragging .chip { cursor: grabbing; }
.chip.lifted { box-shadow: 0 6px 18px rgb(0 0 0 / 0.18); transform: scale(1.03); border-color: var(--accent); background: var(--surface); }
.dragging .chip:not(.lifted) { opacity: 0.75; }
.grip {
  display: grid; place-items: center; border: 0; background: none; color: var(--text-3);
  padding: 6px 2px 6px 4px; border-radius: 6px; cursor: inherit; touch-action: none;
}
.grip:hover, .grip:focus-visible { color: var(--text); }
.chip img { width: 32px; height: 32px; border-radius: 6px; }
.chip-txt { display: flex; flex-direction: column; min-width: 0; line-height: 1.25; padding-left: 2px; }
.chip-txt > * { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
.x { border: 0; background: none; cursor: pointer; font-size: 18px; color: var(--text-3); padding: 0 6px; }
.x:hover { color: var(--text); }
.hint { margin: 8px 0 0; }
</style>
