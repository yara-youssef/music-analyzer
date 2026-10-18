<script setup>
import { ref } from 'vue'
import SongAnalysis from './SongAnalysis.vue'
import { addToCompare, inCompare } from '@/store.js'

const title = ref('')
const artist = ref('')
const text = ref('')
const analyzed = ref(null)

function analyze() {
  analyzed.value = {
    id: `paste-${Date.now()}`,
    title: title.value.trim() || 'Untitled lyrics',
    artist: artist.value.trim() || 'Pasted',
    lyrics: text.value,
    source: 'pasted',
  }
}
</script>

<template>
  <div class="stack">
    <div class="card stack">
      <div class="card-head" style="margin: 0"><h3>Paste lyrics</h3><span class="card-sub">anything works: songs, poems, drafts of your own</span></div>
      <div class="row nowrap">
        <input v-model="title" class="input" placeholder="Title (optional)" />
        <input v-model="artist" class="input" placeholder="Artist (optional)" />
      </div>
      <textarea v-model="text" class="input" rows="12" placeholder="Paste or type lyrics here. Blank lines separate verses."></textarea>
      <div class="row">
        <button class="btn primary" :disabled="!text.trim()" @click="analyze">Analyze</button>
        <button v-if="analyzed" class="btn" :class="{ on: inCompare(analyzed.id) }" :disabled="inCompare(analyzed.id)" @click="addToCompare(analyzed)">
          {{ inCompare(analyzed.id) ? '✓ Added to compare' : '+ Add to compare' }}
        </button>
      </div>
    </div>
    <template v-if="analyzed">
      <h2>{{ analyzed.title }}</h2>
      <SongAnalysis :lyrics="analyzed.lyrics" />
    </template>
  </div>
</template>

<style scoped>
.nowrap { flex-wrap: nowrap; }
@media (max-width: 600px) { .nowrap { flex-wrap: wrap; } }
textarea { resize: vertical; }
</style>
