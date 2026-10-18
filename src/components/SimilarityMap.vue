<script setup>
import { computed, ref } from 'vue'
import { useWidth } from '@/lib/useWidth.js'

// 2D projection of the songs: nearby dots are songs whose lyrics are similar.
const props = defineProps({
  points: { type: Array, required: true }, // [[x, y]]
  labels: { type: Array, required: true },
  groups: { type: Array, required: true }, // group (artist) per point
  height: { type: Number, default: 380 },
})

const el = ref(null)
const width = useWidth(el)
const hover = ref(null)
const pad = 40

// Up to three artists get their own hue; beyond that everything is one hue and
// the labels carry identity (more than three hues can't be told apart reliably).
const groupList = computed(() => [...new Set(props.groups)])
const colored = computed(() => groupList.value.length > 1 && groupList.value.length <= 3)
const colorOf = (g) => (colored.value ? `var(--series-${groupList.value.indexOf(g) + 1})` : 'var(--series-1)')

const scaled = computed(() => {
  const xs = props.points.map((p) => p[0])
  const ys = props.points.map((p) => p[1])
  const span = (a) => Math.max(1e-9, Math.max(...a) - Math.min(...a))
  const sx = (width.value - pad * 2) / span(xs)
  const sy = (props.height - pad * 2) / span(ys)
  return props.points.map(([x, y]) => [
    pad + (x - Math.min(...xs)) * sx,
    pad + (y - Math.min(...ys)) * sy,
  ])
})
const trunc = (s, k = 22) => (s.length > k ? s.slice(0, k - 1) + '…' : s)
</script>

<template>
  <div ref="el" class="map">
    <svg :width="width" :height="height" role="img" aria-label="Map of songs by lyrical similarity">
      <rect x="0" y="0" :width="width" :height="height" rx="8" class="bg" />
      <g v-for="(p, i) in scaled" :key="i" @mouseenter="hover = i" @mouseleave="hover = null"
        :class="{ dim: hover !== null && hover !== i }" class="pt">
        <circle :cx="p[0]" :cy="p[1]" r="14" fill="transparent" />
        <circle :cx="p[0]" :cy="p[1]" r="6" :fill="colorOf(groups[i])" class="dot" />
        <text :x="p[0]" :y="p[1] - 11" text-anchor="middle" class="lbl">{{ trunc(labels[i]) }}</text>
      </g>
    </svg>
    <div v-if="hover !== null" class="chart-tip" :style="{ left: scaled[hover][0] + 'px', top: scaled[hover][1] - 14 + 'px' }">
      <b>{{ labels[hover] }}</b><br />{{ groups[hover] }}
    </div>
    <div v-if="colored" class="legend">
      <span v-for="g in groupList" :key="g"><i :style="{ background: colorOf(g) }"></i>{{ g }}</span>
    </div>
    <p class="faint">Distances are relative: the axes have no units, only closeness matters.</p>
  </div>
</template>

<style scoped>
.map { position: relative; }
.bg { fill: var(--surface-2); opacity: 0.5; }
.dot { stroke: var(--surface); stroke-width: 2; }
.lbl { font-size: 12px; fill: var(--text); paint-order: stroke; stroke: var(--surface); stroke-width: 3px; }
.pt { transition: opacity 0.15s; cursor: default; }
.pt.dim { opacity: 0.3; }
p { margin: 6px 0 0; }
</style>
