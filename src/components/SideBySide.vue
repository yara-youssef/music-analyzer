<script setup>
import { computed } from 'vue'
import WordCloud from './WordCloud.vue'
import BarChart from './BarChart.vue'
import SentimentArc from './SentimentArc.vue'
import RepetitionMatrix from './RepetitionMatrix.vue'
import { songSummary } from '@/lib/summary.js'

// The Explore song analysis for several songs at once: one column per song,
// one row per chart, so the same chart lines up across songs.
const props = defineProps({ songs: { type: Array, required: true } })
const emit = defineEmits(['open'])

const summaries = computed(() => props.songs.map((s) => songSummary(s.lyrics)))
// Emotional arcs share one scale so their heights are comparable between songs.
const arcMax = computed(() =>
  Math.max(0.15, ...summaries.value.flatMap((s) => s.arc.map((p) => Math.abs(p.value)))),
)
const cols = computed(() => `repeat(${props.songs.length}, minmax(260px, 1fr))`)
</script>

<template>
  <p v-if="songs.length > 1" class="faint swipe">Swipe sideways to see every song.</p>
  <div class="sbs-wrap">
    <div class="sbs" :style="{ gridTemplateColumns: cols }">
      <div v-for="s in songs" :key="'h' + s.id" class="cell head">
        <img v-if="s.artwork" :src="s.artwork" alt="" />
        <div class="ph" v-else>{{ s.title[0] }}</div>
        <div class="txt">
          <a href="#" class="title" @click.prevent="emit('open', s)">{{ s.title }}</a>
          <span class="faint">{{ s.artist }}</span>
        </div>
      </div>

      <div class="row-title"><h3>At a glance</h3></div>
      <div v-for="(sum, i) in summaries" :key="'g' + songs[i].id" class="cell">
        <dl class="glance">
          <template v-for="t in sum.tiles" :key="t.label">
            <dt>{{ t.label }}</dt>
            <dd><b>{{ t.value }}</b><span v-if="t.label === 'Mood'" class="faint mood">{{ t.hint }}</span></dd>
          </template>
        </dl>
      </div>

      <div class="row-title">
        <h3>Word cloud</h3>
        <span class="legend">
          <span><i style="background: var(--pos)"></i>positive</span>
          <span><i style="background: var(--neg)"></i>negative</span>
          <span><i style="background: var(--text-2)"></i>neutral</span>
        </span>
      </div>
      <div v-for="(sum, i) in summaries" :key="'c' + songs[i].id" class="cell">
        <WordCloud :words="sum.cloudWords" :height="240" :legend="false" />
      </div>

      <div class="row-title"><h3>Most used words</h3><span class="card-sub">filler words removed</span></div>
      <div v-for="(sum, i) in summaries" :key="'t' + songs[i].id" class="cell">
        <BarChart :items="sum.top(10)" :label-width="90" :bar-height="16" />
      </div>

      <div class="row-title"><h3>Emotional words</h3><span class="card-sub">positive → right, negative → left</span></div>
      <div v-for="(sum, i) in summaries" :key="'e' + songs[i].id" class="cell">
        <BarChart v-if="sum.emotive(4).length" :items="sum.emotive(4)" diverging :label-width="80" :bar-height="16"
          :format="(v) => String(Math.abs(v))" />
        <p v-else class="faint">No strongly emotional words.</p>
      </div>

      <div class="row-title"><h3>Emotional arc</h3><span class="card-sub">same scale for every song</span></div>
      <div v-for="(sum, i) in summaries" :key="'a' + songs[i].id" class="cell">
        <SentimentArc :points="sum.arc" :height="160" :scale-max="arcMax" />
      </div>

      <div class="row-title">
        <h3>Repetition map</h3>
        <span class="legend">
          <span><i style="background: var(--series-1)"></i>repeated meaningful word</span>
          <span><i style="background: var(--neutral)"></i>repeated filler word</span>
        </span>
      </div>
      <div v-for="s in songs" :key="'r' + s.id" class="cell">
        <RepetitionMatrix :text="s.lyrics" :legend="false" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.sbs-wrap { overflow-x: auto; scroll-snap-type: x proximity; padding-bottom: 6px; }
.sbs { display: grid; gap: 12px; min-width: 0; }
.cell {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  padding: 14px; min-width: 0; scroll-snap-align: start;
}
.cell.head { display: flex; align-items: center; gap: 10px; }
.head img, .head .ph { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; flex: none; }
.head .ph { display: grid; place-items: center; background: var(--surface-2); color: var(--text-3); font-weight: 700; }
.head .txt { display: flex; flex-direction: column; min-width: 0; }
.head .txt > * { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.title { color: var(--text); font-weight: 600; text-decoration: none; }
.title:hover { color: var(--accent); }
/* Row headings span every column and stay put while the columns scroll sideways. */
.row-title {
  grid-column: 1 / -1; position: sticky; left: 0; width: fit-content; max-width: 100%;
  display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; margin-top: 10px;
}
.row-title .legend { margin-top: 0; }
.glance { display: grid; grid-template-columns: auto 1fr; gap: 6px 12px; margin: 0; font-size: 14px; }
.glance dt { color: var(--text-2); }
.glance dd { margin: 0; text-align: right; font-variant-numeric: tabular-nums; }
.glance .mood { display: block; }
.swipe { display: none; margin: -4px 0 0; }
@media (max-width: 700px) { .swipe { display: block; } }
</style>
