<script setup>
import { computed, ref } from 'vue'
import { useWidth } from '@/lib/useWidth.js'

// Horizontal bar chart. With `diverging`, bars grow left (negative) or right
// (positive) from a zero line and are tinted by sign.
const props = defineProps({
  items: { type: Array, required: true }, // [{ label, value, note? }]
  diverging: { type: Boolean, default: false },
  format: { type: Function, default: (v) => String(v) },
  barHeight: { type: Number, default: 20 },
  labelWidth: { type: Number, default: 130 },
})

const el = ref(null)
const width = useWidth(el)
const hover = ref(null)
const gap = 6
const valueRoom = 52

const height = computed(() => props.items.length * (props.barHeight + gap))
// Diverging bars print negative values to the left of the bar, so reserve room there too.
const leftRoom = computed(() => (props.diverging ? valueRoom : 0))
const plotW = computed(() => Math.max(60, width.value - props.labelWidth - valueRoom - leftRoom.value))
const extent = computed(() => {
  const vals = props.items.map((d) => d.value)
  if (props.diverging) {
    const m = Math.max(1e-9, ...vals.map(Math.abs))
    return [-m, m]
  }
  return [0, Math.max(1e-9, ...vals)]
})
const x = (v) => leftRoom.value + ((v - extent.value[0]) / (extent.value[1] - extent.value[0])) * plotW.value
const zero = computed(() => x(0))

function bar(d) {
  const x0 = Math.min(zero.value, x(d.value))
  const w = Math.max(2, Math.abs(x(d.value) - zero.value))
  return { x: x0, w }
}
function truncate(s, n = 20) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}
</script>

<template>
  <div ref="el" class="bars">
    <svg :width="width" :height="height" role="img">
      <g :transform="`translate(${labelWidth},0)`">
        <line v-if="diverging" :x1="zero" :x2="zero" y1="0" :y2="height" class="zero" />
        <g
          v-for="(d, i) in items"
          :key="d.label + i"
          :transform="`translate(0,${i * (barHeight + gap)})`"
          @mouseenter="hover = { d, i }"
          @mouseleave="hover = null"
        >
          <rect :x="-labelWidth" :width="width" :height="barHeight + gap" fill="transparent" />
          <text :x="-8" :y="barHeight / 2" dy="0.35em" text-anchor="end" class="label">
            <title>{{ d.label }}</title>{{ truncate(d.label) }}
          </text>
          <rect
            :x="bar(d).x"
            :width="bar(d).w"
            :height="barHeight"
            rx="4"
            :class="['bar', diverging ? (d.value >= 0 ? 'pos' : 'neg') : 'seq', { hl: hover && hover.i === i }]"
          />
          <text
            :x="diverging && d.value < 0 ? bar(d).x - 6 : bar(d).x + bar(d).w + 6"
            :y="barHeight / 2"
            dy="0.35em"
            :text-anchor="diverging && d.value < 0 ? 'end' : 'start'"
            class="value"
          >{{ format(d.value) }}</text>
        </g>
      </g>
    </svg>
    <div
      v-if="hover && hover.d.note"
      class="chart-tip"
      :style="{ left: labelWidth + leftRoom + plotW / 2 + 'px', top: hover.i * (barHeight + gap) + 'px' }"
    >
      <b>{{ hover.d.label }}</b><br />{{ hover.d.note }}
    </div>
  </div>
</template>

<style scoped>
.bars { position: relative; }
.label { fill: var(--text-2); font-size: 12px; }
.value { fill: var(--text-3); font-size: 11px; font-variant-numeric: tabular-nums; }
.bar.seq { fill: var(--series-1); }
.bar.pos { fill: var(--pos); }
.bar.neg { fill: var(--neg); }
.bar { transition: opacity 0.15s; }
.bar.hl { opacity: 0.8; }
.zero { stroke: var(--text-3); stroke-width: 1; }
</style>
