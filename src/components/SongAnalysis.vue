<script setup>
import { computed, ref } from 'vue'
import WordCloud from './WordCloud.vue'
import BarChart from './BarChart.vue'
import SentimentArc from './SentimentArc.vue'
import RepetitionMatrix from './RepetitionMatrix.vue'
import StatTiles from './StatTiles.vue'
import { textStats, wordFrequencies, topWords } from '@/lib/text.js'
import { sentiment, sentimentArc } from '@/lib/sentiment.js'
import { pct, signed, num, moodLabel } from '@/lib/format.js'

const props = defineProps({ lyrics: { type: String, required: true } })
const showLyrics = ref(false)

const stats = computed(() => textStats(props.lyrics))
const freq = computed(() => wordFrequencies(props.lyrics))
const sent = computed(() => sentiment(props.lyrics))
const arc = computed(() => sentimentArc(props.lyrics))

const tiles = computed(() => [
  { label: 'Words', value: num(stats.value.words), hint: `${stats.value.lines} lines · ${stats.value.stanzas} stanzas` },
  { label: 'Unique words', value: num(stats.value.uniqueWords) },
  { label: 'Vocabulary richness', value: pct(stats.value.mattr), hint: 'distinct words per 50-word window' },
  { label: 'Repeated lines', value: pct(stats.value.repetition), hint: 'share of lines that recur' },
  { label: 'Mood', value: signed(sent.value.comparative), hint: moodLabel(sent.value.comparative) },
])

const top = computed(() => topWords(freq.value, 15).map((d) => ({ label: d.word, value: d.count })))
const emotive = computed(() => {
  const toItems = (m, sign) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([w, c]) => ({ label: w, value: sign * c, note: `${c}× in the song` }))
  return [...toItems(sent.value.positive, 1), ...toItems(sent.value.negative, -1)].sort((a, b) => b.value - a.value)
})
</script>

<template>
  <div class="stack">
    <StatTiles :stats="tiles" />
    <div class="card">
      <div class="card-head"><h3>Word cloud</h3><span class="card-sub">size = how often a word appears</span></div>
      <WordCloud :words="topWords(freq, 90)" />
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
        <SentimentArc :points="arc" />
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
