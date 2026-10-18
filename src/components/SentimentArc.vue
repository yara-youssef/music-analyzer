<script setup>
import { computed, ref } from 'vue'
import { useWidth } from '@/lib/useWidth.js'

const props = defineProps({
  points: { type: Array, required: true }, // [{ index, value, line }]
  height: { type: Number, default: 200 },
})

const el = ref(null)
const width = useWidth(el)
const hover = ref(null)
const m = { top: 12, right: 12, bottom: 24, left: 36 }

const innerW = computed(() => width.value - m.left - m.right)
const innerH = computed(() => props.height - m.top - m.bottom)
const maxAbs = computed(() => Math.max(0.15, ...props.points.map((p) => Math.abs(p.value))))
const x = (i) => (props.points.length > 1 ? (i / (props.points.length - 1)) * innerW.value : innerW.value / 2)
const y = (v) => innerH.value / 2 - (v / maxAbs.value) * (innerH.value / 2)

const linePath = computed(() => props.points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.value)}`).join(''))
// Separate fills above and below zero so the area reads as positive / negative.
function areaPath(sign) {
  if (!props.points.length) return ''
  const pts = props.points.map((p, i) => `L${x(i)},${y(sign > 0 ? Math.max(0, p.value) : Math.min(0, p.value))}`)
  return `M${x(0)},${y(0)}${pts.join('')}L${x(props.points.length - 1)},${y(0)}Z`
}

function onMove(e) {
  const rect = e.currentTarget.getBoundingClientRect()
  const px = e.clientX - rect.left - m.left
  const i = Math.round((px / innerW.value) * (props.points.length - 1))
  hover.value = props.points[Math.max(0, Math.min(props.points.length - 1, i))]
}
</script>

<template>
  <div ref="el" class="arc">
    <svg :width="width" :height="height" @mousemove="onMove" @mouseleave="hover = null" role="img"
      aria-label="Sentiment across the song, line by line">
      <g :transform="`translate(${m.left},${m.top})`">
        <line :x1="0" :x2="innerW" :y1="y(0)" :y2="y(0)" class="zero" />
        <text :x="-6" :y="y(maxAbs)" dy="0.35em" text-anchor="end">+</text>
        <text :x="-6" :y="y(0)" dy="0.35em" text-anchor="end">0</text>
        <text :x="-6" :y="y(-maxAbs)" dy="0.35em" text-anchor="end">−</text>
        <path :d="areaPath(1)" class="area pos" />
        <path :d="areaPath(-1)" class="area neg" />
        <path :d="linePath" class="line" />
        <text :x="0" :y="innerH + 18">start</text>
        <text :x="innerW" :y="innerH + 18" text-anchor="end">end</text>
        <g v-if="hover">
          <line :x1="x(hover.index)" :x2="x(hover.index)" y1="0" :y2="innerH" class="cross" />
          <circle :cx="x(hover.index)" :cy="y(hover.value)" r="4.5" class="dot" />
        </g>
      </g>
    </svg>
    <div v-if="hover" class="chart-tip" :style="{ left: m.left + x(hover.index) + 'px', top: m.top + y(hover.value) + 'px' }">
      <b>Line {{ hover.index + 1 }}</b> · {{ hover.value >= 0 ? '+' : '' }}{{ hover.value.toFixed(2) }}<br />“{{ hover.line }}”
    </div>
  </div>
</template>

<style scoped>
.arc { position: relative; }
.zero { stroke: var(--text-3); stroke-dasharray: 3 3; }
.line { fill: none; stroke: var(--text); stroke-width: 2; stroke-linejoin: round; }
.area.pos { fill: var(--pos); opacity: 0.35; }
.area.neg { fill: var(--neg); opacity: 0.35; }
.cross { stroke: var(--text-3); }
.dot { fill: var(--text); stroke: var(--surface); stroke-width: 2; }
</style>
