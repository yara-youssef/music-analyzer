<script setup>
import { computed, ref } from 'vue'
import WordCloud from './WordCloud.vue'
import BarChart from './BarChart.vue'
import SentimentArc from './SentimentArc.vue'
import RepetitionMatrix from './RepetitionMatrix.vue'
import StatTiles from './StatTiles.vue'
import { songSummary } from '@/lib/summary.js'

const props = defineProps({ lyrics: { type: String, required: true } })
const showLyrics = ref(false)

const summary = computed(() => songSummary(props.lyrics))
const top = computed(() => summary.value.top(15))
const emotive = computed(() => summary.value.emotive(6))
</script>

<template>
  <div class="stack">
    <StatTiles :stats="summary.tiles" />
    <div class="card">
      <div class="card-head"><h3>Word cloud</h3><span class="card-sub">size = how often a word appears</span></div>
      <WordCloud :words="summary.cloudWords" />
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-head"><h3>Most used words</h3><span class="card-sub">filler words removed</span></div>
        <BarChart :items="top" />
      </div>
      <div class="card">
        <div class="card-head"><h3>Emotional words</h3><span class="card-sub">count of positive vs negative words</span></div>
        <BarChart v-if="emotive.length" :items="emotive" diverging :format="(v) => String(Math.abs(v))" />
        <p v-else class="faint">No strongly emotional words found.</p>
      </div>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-head"><h3>Emotional arc</h3><span class="card-sub">sentiment line by line (hover to read)</span></div>
        <SentimentArc :points="summary.arc" />
      </div>
      <div class="card">
        <div class="card-head"><h3>Repetition map</h3><span class="card-sub">word × word; stripes are repeated phrases</span></div>
        <RepetitionMatrix :text="lyrics" />
      </div>
    </div>
    <div class="card">
      <div class="card-head">
        <h3>Lyrics</h3>
        <button class="btn small ghost" @click="showLyrics = !showLyrics">{{ showLyrics ? 'Hide' : 'Show' }}</button>
      </div>
      <pre v-if="showLyrics" class="lyrics">{{ lyrics }}</pre>
    </div>
  </div>
</template>

<style scoped>
.lyrics { white-space: pre-wrap; font: inherit; color: var(--text-2); margin: 0; max-height: 480px; overflow: auto; }
</style>
