<script setup>
import { computed, ref, watch } from 'vue'
import SimilarityHeatmap from './SimilarityHeatmap.vue'
import SimilarityMap from './SimilarityMap.vue'
import { store, removeFromCompare } from '@/store.js'
import { compareSongs } from '@/lib/similarity.js'
import { distinctiveTerms } from '@/lib/text.js'
import { sentiment } from '@/lib/sentiment.js'
import { signed, moodLabel } from '@/lib/format.js'

const emit = defineEmits(['paste', 'open'])
const method = ref('semantic')
const result = ref(null)
const running = ref(false)
const error = ref('')
const progress = ref('')
const selected = ref(null)

const songs = computed(() => store.compare)
const labels = computed(() => songs.value.map((s) => s.title))
let runId = 0

async function run() {
  const id = ++runId
  selected.value = null
  error.value = ''
  if (songs.value.length < 2) {
    result.value = null
    return
  }
  running.value = true
  progress.value = ''
  try {
    const r = await compareSongs(songs.value, method.value, (p) => {
      if (id !== runId) return
      if (p.status === 'progress' && p.file?.endsWith('.onnx')) progress.value = `Downloading language model… ${Math.round(p.progress)}%`
      else if (p.status === 'embedded') progress.value = `Reading lyrics… ${p.done}/${p.total}`
    })
    if (id !== runId) return
    result.value = r
    selected.value = r.pairs[0] ? { i: r.pairs[0].i, j: r.pairs[0].j } : null
  } catch (e) {
    if (id === runId) error.value = method.value === 'semantic'
      ? `Could not load the language model (${e.message}). Try "Shared vocabulary" instead.`
      : e.message
  } finally {
    if (id === runId) running.value = false
  }
}
watch([method, () => songs.value.map((s) => s.id).join()], run, { immediate: true })

const pairDetail = computed(() => {
  const r = result.value
  const sel = selected.value
  if (!r || !sel) return null
  const pair = r.pairs.find((p) => (p.i === sel.i && p.j === sel.j) || (p.i === sel.j && p.j === sel.i))
  if (!pair) return null
  const side = (k) => ({
    song: songs.value[k],
    distinct: distinctiveTerms(r.tfidf[k], 8).filter((w) => !pair.shared.includes(w)).slice(0, 6),
    mood: sentiment(songs.value[k].lyrics).comparative,
  })
  return { ...pair, a: side(pair.i), b: side(pair.j) }
})

function verdict(v) {
  // Thresholds differ by method: embeddings of song lyrics rarely fall below ~0.3.
  const [hi, mid] = method.value === 'semantic' ? [0.75, 0.55] : [0.3, 0.12]
  return v >= hi ? 'Very close' : v >= mid ? 'Related' : 'Far apart'
}
const closest = computed(() => result.value?.pairs.slice(0, 3) ?? [])
const farthest = computed(() => (result.value ? result.value.pairs.slice(-3).reverse() : []))
const pairName = (p) => `${songs.value[p.i].title} ↔ ${songs.value[p.j].title}`
</script>

<template>
  <div class="stack">
    <div class="card">
      <div class="card-head">
        <h3>Songs to compare</h3>
        <button class="btn small" @click="emit('paste')">+ Paste lyrics</button>
      </div>
      <p v-if="!songs.length" class="faint">
        Nothing here yet. Use “+ Compare” on any song in Explore, or paste lyrics, to add songs. You need at least two.
      </p>
      <div class="chips">
        <span v-for="s in songs" :key="s.id" class="chip">
          <img v-if="s.artwork" :src="s.artwork" alt="" />
          <span class="chip-txt"><b>{{ s.title }}</b><span class="faint">{{ s.artist }}</span></span>
          <button class="x" @click="removeFromCompare(s.id)" :aria-label="`Remove ${s.title}`">×</button>
        </span>
      </div>
      <div v-if="songs.length" class="row foot">
        <span class="faint">Compare by</span>
        <div class="segmented">
          <button :class="{ active: method === 'semantic' }" @click="method = 'semantic'" title="An AI language model reads each song and compares what they are about">Meaning (AI)</button>
          <button :class="{ active: method === 'lexical' }" @click="method = 'lexical'" title="Compares which distinctive words the songs share">Shared vocabulary</button>
        </div>
        <span v-if="running" class="faint"><span class="spinner"></span> {{ progress || 'Comparing…' }}</span>
        <button class="btn small ghost" style="margin-left: auto" @click="store.compare.splice(0)">Clear all</button>
      </div>
      <p v-if="method === 'semantic' && songs.length > 1" class="faint note">
        “Meaning” runs a small language model (all-MiniLM-L6-v2) in your browser, so songs about the same thing score
        close even when they use different words. The first run downloads about 23 MB.
      </p>
      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <template v-if="result && songs.length > 1">
      <div class="grid-2">
        <div class="card">
          <div class="card-head"><h3>Closest pairs</h3></div>
          <ul class="pairs">
            <li v-for="p in closest" :key="'c' + p.i + p.j" @click="selected = { i: p.i, j: p.j }">
              <span class="pname">{{ pairName(p) }}</span>
              <span class="score">{{ Math.round(p.value * 100) }}%</span>
            </li>
          </ul>
        </div>
        <div class="card">
          <div class="card-head"><h3>Furthest apart</h3></div>
          <ul class="pairs">
            <li v-for="p in farthest" :key="'f' + p.i + p.j" @click="selected = { i: p.i, j: p.j }">
              <span class="pname">{{ pairName(p) }}</span>
              <span class="score">{{ Math.round(p.value * 100) }}%</span>
            </li>
          </ul>
        </div>
      </div>
      <div class="grid-2">
        <div class="card">
          <div class="card-head"><h3>Similarity matrix</h3><span class="card-sub">click a cell for details</span></div>
          <SimilarityHeatmap :labels="labels" :matrix="result.matrix" :selected="selected" @select="selected = $event" />
        </div>
        <div class="card">
          <div class="card-head"><h3>Song map</h3><span class="card-sub">closer together = more alike</span></div>
          <SimilarityMap :points="result.points" :labels="labels" :groups="songs.map((s) => s.artist)" />
        </div>
      </div>
      <div v-if="pairDetail" class="card">
        <div class="card-head">
          <h3>{{ pairDetail.a.song.title }} ↔ {{ pairDetail.b.song.title }}</h3>
          <span class="verdict">{{ verdict(pairDetail.value) }} · {{ Math.round(pairDetail.value * 100) }}%</span>
        </div>
        <div class="detail">
          <div>
            <div class="faint">Only in “{{ pairDetail.a.song.title }}”</div>
            <div class="tags">
              <span v-for="w in pairDetail.a.distinct" :key="w" class="tag">{{ w }}</span>
            </div>
            <div class="faint">Mood {{ signed(pairDetail.a.mood) }} · {{ moodLabel(pairDetail.a.mood) }}</div>
          </div>
          <div class="shared">
            <div class="faint">Shared words</div>
            <div class="tags">
              <span v-for="w in pairDetail.shared" :key="w" class="tag strong">{{ w }}</span>
              <span v-if="!pairDetail.shared.length" class="faint">none: any closeness comes from meaning, not wording</span>
            </div>
          </div>
          <div>
            <div class="faint">Only in “{{ pairDetail.b.song.title }}”</div>
            <div class="tags">
              <span v-for="w in pairDetail.b.distinct" :key="w" class="tag">{{ w }}</span>
            </div>
            <div class="faint">Mood {{ signed(pairDetail.b.mood) }} · {{ moodLabel(pairDetail.b.mood) }}</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { display: inline-flex; align-items: center; gap: 8px; padding: 4px 4px 4px 4px; border: 1px solid var(--border); border-radius: 10px; background: var(--surface-2); max-width: 280px; }
.chip img { width: 32px; height: 32px; border-radius: 6px; }
.chip-txt { display: flex; flex-direction: column; min-width: 0; line-height: 1.25; padding-left: 4px; }
.chip-txt > * { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
.x { border: 0; background: none; cursor: pointer; font-size: 18px; color: var(--text-3); padding: 0 6px; }
.x:hover { color: var(--text); }
.foot { margin-top: 14px; }
.note { margin: 10px 0 0; }
.pairs { list-style: none; margin: 0; padding: 0; }
.pairs li { display: flex; justify-content: space-between; gap: 12px; padding: 8px 6px; border-bottom: 1px solid var(--border); cursor: pointer; border-radius: 6px; }
.pairs li:hover { background: var(--surface-2); }
.pname { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.score { font-variant-numeric: tabular-nums; font-weight: 600; }
.verdict { font-weight: 600; color: var(--text-2); }
.detail { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
.detail > div { display: flex; flex-direction: column; gap: 8px; }
.shared { border-left: 1px solid var(--border); border-right: 1px solid var(--border); padding: 0 20px; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; }
.tag { padding: 2px 9px; border-radius: 999px; background: var(--surface-2); font-size: 13px; }
.tag.strong { background: color-mix(in srgb, var(--accent) 16%, var(--surface)); color: var(--text); }
@media (max-width: 760px) {
  .detail { grid-template-columns: 1fr; }
  .shared { border: 0; padding: 0; }
}
</style>
