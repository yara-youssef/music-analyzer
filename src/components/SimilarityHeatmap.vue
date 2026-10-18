<script setup>
import { computed, ref } from 'vue'
import { useWidth } from '@/lib/useWidth.js'

const props = defineProps({
  labels: { type: Array, required: true },
  matrix: { type: Array, required: true },
  selected: { type: Object, default: null }, // { i, j }
})
const emit = defineEmits(['select'])

const el = ref(null)
const width = useWidth(el)
const hover = ref(null)
const labelW = 140
const n = computed(() => props.labels.length)
const cell = computed(() => Math.max(18, Math.min(56, (width.value - labelW - 8) / n.value)))

// Off-diagonal range, so contrast is spent on the differences that exist.
const range = computed(() => {
  const vals = []
  props.matrix.forEach((r, i) => r.forEach((v, j) => i !== j && vals.push(v)))
  if (!vals.length) return [0, 1]
  const lo = Math.min(...vals)
  const hi = Math.max(...vals)
  return hi - lo < 1e-6 ? [lo - 0.05, hi + 0.05] : [lo, hi]
})

// Sequential single-hue ramp: low similarity recedes toward the surface.
function color(v, diag) {
  if (diag) return 'var(--surface-2)'
  const t = Math.max(0, Math.min(1, (v - range.value[0]) / (range.value[1] - range.value[0])))
  const stops = ['--seq-0', '--seq-1', '--seq-2', '--seq-3']
  const k = Math.min(2, Math.floor(t * 3))
  const local = (t * 3 - k) * 100
  return `color-mix(in oklab, var(${stops[k + 1]}) ${local}%, var(${stops[k]}))`
}
const textOn = (v) => ((v - range.value[0]) / (range.value[1] - range.value[0]) > 0.6 ? 'light' : 'dark')
const trunc = (s, k = 18) => (s.length > k ? s.slice(0, k - 1) + '…' : s)
const isSel = (i, j) => props.selected && ((props.selected.i === i && props.selected.j === j) || (props.selected.i === j && props.selected.j === i))
</script>

<template>
  <div ref="el" class="heat">
    <svg :width="labelW + cell * n + 4" :height="labelW + cell * n + 4" role="img" aria-label="Pairwise similarity matrix">
      <g :transform="`translate(${labelW},${labelW})`">
        <text
          v-for="(l, j) in labels" :key="'c' + j"
          :transform="`translate(${j * cell + cell / 2},-8) rotate(-45)`"
          class="lbl" :class="{ act: hover && (hover.j === j || hover.i === j) }"
        ><title>{{ l }}</title>{{ trunc(l) }}</text>
        <text
          v-for="(l, i) in labels" :key="'r' + i"
          :x="-8" :y="i * cell + cell / 2" dy="0.35em" text-anchor="end"
          class="lbl" :class="{ act: hover && (hover.i === i || hover.j === i) }"
        ><title>{{ l }}</title>{{ trunc(l) }}</text>
        <g v-for="(row, i) in matrix" :key="i">
          <g v-for="(v, j) in row" :key="j"
            @mouseenter="hover = { i, j, v }" @mouseleave="hover = null"
            @click="i !== j && emit('select', { i, j })" :class="{ clickable: i !== j }">
            <rect :x="j * cell + 1" :y="i * cell + 1" :width="cell - 2" :height="cell - 2" rx="3"
              :fill="color(v, i === j)" :class="{ sel: isSel(i, j) }" />
            <text v-if="cell >= 34 && i !== j" :x="j * cell + cell / 2" :y="i * cell + cell / 2" dy="0.35em"
              text-anchor="middle" :class="['val', textOn(v)]">{{ Math.round(v * 100) }}</text>
          </g>
        </g>
      </g>
    </svg>
    <div v-if="hover && hover.i !== hover.j" class="chart-tip"
      :style="{ left: labelW + hover.j * cell + cell / 2 + 'px', top: labelW + hover.i * cell + 'px' }">
      <b>{{ labels[hover.i] }}</b> ↔ <b>{{ labels[hover.j] }}</b><br />similarity {{ (hover.v * 100).toFixed(0) }}%
    </div>
    <div class="scale">
      <span>less similar</span>
      <div class="ramp"></div>
      <span>more similar</span>
    </div>
  </div>
</template>

<style scoped>
.heat { position: relative; overflow-x: auto; }
.lbl { font-size: 12px; fill: var(--text-2); }
.lbl.act { fill: var(--text); font-weight: 600; }
.val { font-size: 11px; font-variant-numeric: tabular-nums; pointer-events: none; }
.val.dark { fill: var(--text); }
.val.light { fill: var(--surface); }
.clickable { cursor: pointer; }
rect.sel { stroke: var(--text); stroke-width: 2; }
.scale { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-3); margin-top: 6px; }
.ramp { width: 140px; height: 10px; border-radius: 3px; background: linear-gradient(90deg, var(--seq-0), var(--seq-1), var(--seq-2), var(--seq-3)); }
</style>
