<script setup>
import { computed } from 'vue'
import WordCloud from './WordCloud.vue'
import BarChart from './BarChart.vue'
import StatTiles from './StatTiles.vue'
import { textStats, wordFrequencies, topWords, mergeFrequencies, tfidf, distinctiveTerms } from '@/lib/text.js'
import { sentiment } from '@/lib/sentiment.js'
import { pct, signed, num, moodLabel } from '@/lib/format.js'

// Aggregate analysis over several songs (an album or an artist's top songs).
const props = defineProps({ songs: { type: Array, required: true } }) // songs with .lyrics
const emit = defineEmits(['open'])

const perSong = computed(() =>
  props.songs.map((s) => ({ song: s, stats: textStats(s.lyrics), sent: sentiment(s.lyrics) })),
)
const merged = computed(() => mergeFrequencies(props.songs.map((s) => wordFrequencies(s.lyrics))))
const distinctive = computed(() => {
  const { vectors } = tfidf(props.songs.map((s) => s.lyrics))
  return vectors.map((v) => distinctiveTerms(v, 5))
})
const avg = (f) => perSong.value.reduce((a, p) => a + f(p), 0) / Math.max(1, perSong.value.length)

const tiles = computed(() => [
  { label: 'Songs analysed', value: props.songs.length },
  { label: 'Total words', value: num(avg((p) => p.stats.words) * perSong.value.length), hint: `${num(avg((p) => p.stats.words))} per song` },
  { label: 'Distinct words', value: num(merged.value.size), hint: 'excluding filler words' },
  { label: 'Vocabulary richness', value: pct(avg((p) => p.stats.mattr)), hint: 'average per song' },
  { label: 'Mood', value: signed(avg((p) => p.sent.comparative)), hint: moodLabel(avg((p) => p.sent.comparative)) },
])

const label = (s) => s.title
const moodBars = computed(() =>
  perSong.value
    .map((p) => ({ label: label(p.song), value: p.sent.comparative, note: moodLabel(p.sent.comparative) }))
    .sort((a, b) => b.value - a.value),
)
const richnessBars = computed(() =>
  perSong.value
    .map((p) => ({ label: label(p.song), value: p.stats.mattr, note: `${num(p.stats.uniqueWords)} unique of ${num(p.stats.words)} words` }))
    .sort((a, b) => b.value - a.value),
)
const repetitionBars = computed(() =>
  perSong.value
    .map((p) => ({ label: label(p.song), value: p.stats.repetition }))
    .sort((a, b) => b.value - a.value),
)
const top = computed(() => topWords(merged.value, 15).map((d) => ({ label: d.word, value: d.count })))
// In how many songs does each top word appear? Words in every song are the artist's signature.
const spread = computed(() => {
  const sets = props.songs.map((s) => new Set(wordFrequencies(s.lyrics).keys()))
  return topWords(merged.value, 40)
    .map((d) => ({ label: d.word, value: sets.filter((st) => st.has(d.word)).length / sets.length, note: `appears in ${sets.filter((st) => st.has(d.word)).length} of ${sets.length} songs` }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 12)
})
</script>

<template>
  <div class="stack">
    <StatTiles :stats="tiles" />
    <div class="card">
      <div class="card-head"><h3>Word cloud</h3><span class="card-sub">all songs combined</span></div>
      <WordCloud :words="topWords(merged, 100)" />
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-head"><h3>Most used words</h3><span class="card-sub">total occurrences</span></div>
        <BarChart :items="top" />
      </div>
      <div class="card">
        <div class="card-head"><h3>Recurring themes</h3><span class="card-sub">share of songs a word appears in</span></div>
        <BarChart :items="spread" :format="pct" />
      </div>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-head"><h3>Mood by song</h3><span class="card-sub">sentiment per word, positive → right</span></div>
        <BarChart :items="moodBars" diverging :format="(v) => signed(v)" :label-width="160" />
      </div>
      <div class="card">
        <div class="card-head"><h3>Vocabulary richness by song</h3><span class="card-sub">higher = more varied wording</span></div>
        <BarChart :items="richnessBars" :format="pct" :label-width="160" />
      </div>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-head"><h3>Repetitiveness by song</h3><span class="card-sub">share of lines that recur</span></div>
        <BarChart :items="repetitionBars" :format="pct" :label-width="160" />
      </div>
      <div class="card">
        <div class="card-head"><h3>What makes each song distinct</h3><span class="card-sub">words unusual for this set (TF-IDF)</span></div>
        <table class="dist">
          <tr v-for="(s, i) in songs" :key="s.id">
            <td><a href="#" @click.prevent="emit('open', s)">{{ s.title }}</a></td>
            <td class="muted">{{ distinctive[i].join(' · ') }}</td>
          </tr>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dist { width: 100%; border-collapse: collapse; font-size: 13px; }
.dist td { padding: 6px 4px; border-bottom: 1px solid var(--border); vertical-align: top; }
.dist td:first-child { width: 40%; font-weight: 500; }
.dist a { color: var(--text); text-decoration: none; }
.dist a:hover { color: var(--accent); }
</style>
