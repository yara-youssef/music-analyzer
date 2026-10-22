<script setup>
import { ref, watch, computed } from 'vue'
import cloud from 'd3-cloud'
import { useWidth } from '@/lib/useWidth.js'
import { wordPolarity } from '@/lib/sentiment.js'

const props = defineProps({
  words: { type: Array, required: true }, // [{ word, count }]
  height: { type: Number, default: 340 },
  legend: { type: Boolean, default: true },
})

const el = ref(null)
const width = useWidth(el)
const placed = ref([])
const hover = ref(null)
let layoutRun = 0

const maxCount = computed(() => Math.max(1, ...props.words.map((w) => w.count)))

function tone(word) {
  const p = wordPolarity(word)
  return p > 0 ? 'pos' : p < 0 ? 'neg' : 'neu'
}

function runLayout() {
  const run = ++layoutRun
  const words = props.words.slice(0, 90)
  if (!words.length) {
    placed.value = []
    return
  }
  const w = width.value
  const h = props.height
  const minCount = Math.min(...words.map((x) => x.count))
  const maxSize = Math.min(64, w / 7)
  const scale = (c) => {
    const t = maxCount.value === minCount ? 1 : (Math.sqrt(c) - Math.sqrt(minCount)) / (Math.sqrt(maxCount.value) - Math.sqrt(minCount))
    return 12 + t * (maxSize - 12)
  }
  cloud()
    .size([w, h])
    .words(words.map((d) => ({ text: d.word, count: d.count, size: scale(d.count) })))
    .padding(3)
    .rotate((d, i) => (w >= 480 && i % 7 === 3 ? -90 : 0))
    .font('Inter, system-ui, sans-serif')
    .fontWeight((d) => (d.size > 30 ? 700 : 500))
    .fontSize((d) => d.size)
    .random(seeded(42))
    .on('end', (out) => {
      if (run === layoutRun) placed.value = out
    })
    .start()
}

// Deterministic layout so the same lyrics always produce the same cloud.
function seeded(seed) {
  let s = seed
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
}

watch([() => props.words, width], runLayout, { immediate: true })
</script>

<template>
  <div ref="el" class="cloud" :class="{ 'no-legend': !legend }" :style="{ height: height + 'px' }">
    <svg :width="width" :height="height" role="img" aria-label="Word cloud of the most frequent words">
      <g :transform="`translate(${width / 2},${height / 2})`">
        <text
          v-for="w in placed"
          :key="w.text"
          :class="['word', tone(w.text), { dim: hover && hover.text !== w.text }]"
          text-anchor="middle"
          :transform="`translate(${w.x},${w.y}) rotate(${w.rotate})`"
          :style="{ fontSize: w.size + 'px', fontWeight: w.size > 30 ? 700 : 500 }"
          @mouseenter="hover = w"
          @mouseleave="hover = null"
        >{{ w.text }}</text>
      </g>
    </svg>
    <div
      v-if="hover"
      class="chart-tip"
      :style="{ left: width / 2 + hover.x + 'px', top: height / 2 + hover.y - hover.size * 0.8 + 'px' }"
    >
      <b>{{ hover.text }}</b> · {{ hover.count }}×
    </div>
    <div v-if="legend" class="legend">
      <span><i style="background: var(--pos)"></i>positive word</span>
      <span><i style="background: var(--neg)"></i>negative word</span>
      <span><i style="background: var(--text-2)"></i>neutral</span>
    </div>
  </div>
</template>

<style scoped>
.cloud { position: relative; margin-bottom: 28px; }
.cloud.no-legend { margin-bottom: 0; }
.word { cursor: default; transition: opacity 0.15s; font-family: Inter, system-ui, sans-serif; }
.word.pos { fill: var(--pos); }
.word.neg { fill: var(--neg); }
.word.neu { fill: var(--text-2); }
.word.dim { opacity: 0.25; }
</style>
