<script setup>
import { computed, ref, watch } from 'vue'
import EntityHeader from './EntityHeader.vue'
import TrackList from './TrackList.vue'
import CollectionAnalysis from './CollectionAnalysis.vue'
import { albumTracks } from '@/services/catalog.js'
import { useLyrics } from '@/lib/useLyrics.js'

const props = defineProps({ album: { type: Object, required: true } })
const emit = defineEmits(['open'])
const error = ref('')
const { items, loading, load } = useLyrics()
const withLyrics = computed(() => items.value.filter((t) => t.status === 'ok'))

async function init() {
  error.value = ''
  try {
    await load(await albumTracks(props.album.id))
  } catch (e) {
    error.value = e.message
  }
}
watch(() => props.album.id, init, { immediate: true })
</script>

<template>
  <div class="stack">
    <EntityHeader kind="Album" :title="album.name" :subtitle="[album.artist, album.year].filter(Boolean).join(' · ')" :artwork="album.artwork">
      <button class="btn" @click="emit('open', { type: 'artist', id: album.artistId, name: album.artist })">View artist</button>
    </EntityHeader>
    <p v-if="error" class="error">{{ error }}</p>
    <div class="layout">
      <div class="card tracks">
        <div class="card-head"><h3>Tracks</h3></div>
        <TrackList :tracks="items" @open="(s) => emit('open', s)" />
      </div>
      <div class="main">
        <CollectionAnalysis v-if="withLyrics.length" :songs="withLyrics" @open="(s) => emit('open', s)" />
        <div v-else-if="loading" class="card faint"><span class="spinner"></span> Fetching lyrics…</div>
        <p v-else class="faint">No lyrics were found for this album.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.layout { display: grid; grid-template-columns: minmax(280px, 340px) 1fr; gap: 16px; align-items: start; }
.tracks { position: sticky; top: 76px; }
.main { min-width: 0; }
@media (max-width: 900px) {
  .layout { grid-template-columns: 1fr; }
  .tracks { position: static; }
}
</style>
