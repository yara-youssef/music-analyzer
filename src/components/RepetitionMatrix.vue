<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useWidth } from '@/lib/useWidth.js'
import { cleanLyrics, tokenize, normalizeWord } from '@/lib/text.js'
import { STOPWORDS } from '@/lib/stopwords.js'

// Self-similarity matrix: word i (row) vs word j (column) is filled when they are
// the same word. Choruses show up as diagonal stripes, refrains as squares.
const props = defineProps({
  text: { type: String, required: true },
  legend: { type: Boolean, default: true },
})
const MAX_TOKENS = 600

const wrap = ref(null)
const canvas = ref(null)
const width = useWidth(wrap)
const hover = ref(null)

const allTokens = computed(() => tokenize(cleanLyrics(props.text)).map(normalizeWord))
const tokens = computed(() => allTokens.value.slice(0, MAX_TOKENS))
const truncated = computed(() => allTokens.value.length > MAX_TOKENS)
const size = computed(() => Math.min(width.value, 460))

function draw() {
  const c = canvas.value
  if (!c) return
  const dpr = window.devicePixelRatio || 1
  const s = size.value
  c.width = s * dpr
  c.height = s * dpr
  c.style.width = s + 'px'
  c.style.height = s + 'px'
  const ctx = c.getContext('2d')
  ctx.scale(dpr, dpr)
  const css = getComputedStyle(c)
  ctx.fillStyle = css.getPropertyValue('--seq-0')
  ctx.fillRect(0, 0, s, s)
  const t = tokens.value
  const n = t.length
  if (!n) return
  const cell = s / n
  const strong = css.getPropertyValue('--series-1')
  const weak = css.getPropertyValue('--neutral')
  // Group positions by word so the work is proportional to matches, not n².
  const positions = new Map()
  t.forEach((w, i) => positions.set(w, [...(positions.get(w) || []), i]))
  for (const [w, idx] of positions) {
    if (idx.length < 2) continue
    ctx.fillStyle = STOPWORDS.has(w) ? weak : strong
    for (const i of idx) for (const j of idx) ctx.fillRect(j * cell, i * cell, Math.max(cell, 1), Math.max(cell, 1))
  }
}

function onMove(e) {
  const rect = canvas.value.getBoundingClientRect()
  const n = tokens.value.length
  const i = Math.floor(((e.clientY - rect.top) / size.value) * n)
  const j = Math.floor(((e.clientX - rect.left) / size.value) * n)
  if (i < 0 || j < 0 || i >= n || j >= n) return (hover.value = null)
  const ctx = (k) => tokens.value.slice(Math.max(0, k - 3), k + 4).join(' ')
  hover.value = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
    match: tokens.value[i] === tokens.value[j],
    a: ctx(i),
    b: ctx(j),
    word: tokens.value[i],
  }
}

// Canvas pixels don't follow CSS variables, so repaint when the color scheme flips.
const scheme = window.matchMedia('(prefers-color-scheme: dark)')
onMounted(() => {
  draw()
  scheme.addEventListener('change', draw)
})
onBeforeUnmount(() => scheme.removeEventListener('change', draw))
watch([tokens, size], draw)
</script>

<template>
  <div ref="wrap" class="rep">
    <div class="canvas-wrap" :style="{ width: size + 'px' }">
      <canvas ref="canvas" @mousemove="onMove" @mouseleave="hover = null" role="img"
        aria-label="Repetition matrix: filled cells mark a word that recurs"></canvas>
      <div v-if="hover" class="chart-tip" :style="{ left: hover.x + 'px', top: hover.y + 'px' }">
        <template v-if="hover.match"><b>“{{ hover.word }}”</b> repeats<br /></template>
        …{{ hover.a }}…<br />…{{ hover.b }}…
      </div>
    </div>
    <div v-if="legend || truncated" class="legend">
      <template v-if="legend">
        <span><i style="background: var(--series-1)"></i>repeated meaningful word</span>
        <span><i style="background: var(--neutral)"></i>repeated filler word</span>
      </template>
      <span v-if="truncated">first {{ MAX_TOKENS }} words shown</span>
    </div>
  </div>
</template>

<style scoped>
.rep { display: flex; flex-direction: column; align-items: center; }
.canvas-wrap { position: relative; }
canvas { display: block; border-radius: 6px; cursor: crosshair; }
</style>
