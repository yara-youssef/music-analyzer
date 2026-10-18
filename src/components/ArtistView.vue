<script setup>
import { computed, ref, watch } from 'vue'
import EntityHeader from './EntityHeader.vue'
import TrackList from './TrackList.vue'
import CollectionAnalysis from './CollectionAnalysis.vue'
import { artistAlbums, artistTopSongs } from '@/services/catalog.js'
import { useLyrics } from '@/lib/useLyrics.js'

const props = defineProps({ artist: { type: Object, required: true } })
const emit = defineEmits(['open'])

const albums = ref([])
const error = ref('')
const songCount = ref(15)
const { items, loading, load } = useLyrics()
const withLyrics = computed(() => items.value.filter((t) => t.status === 'ok'))

async function init() {
  error.value = ''
  albums.value = []
  try {
    const [al, songs] = await Promise.all([artistAlbums(props.artist.id), artistTopSongs(props.artist.id, songCount.value)])
    albums.value = al
    await load(songs)
  } catch (e) {
    error.value = e.message
  }
}
watch(() => props.artist.id, init, { immediate: true })
watch(songCount, init)
</script>

<template>
  <div class="stack">
    <EntityHeader kind="Artist" :title="artist.name" :subtitle="artist.genre" :artwork="albums[0]?.artwork" />
    <p v-if="error" class="error">{{ error }}</p>
    <div class="grid-2">
      <div class="card">
        <div class="card-head">
          <h3>Top songs</h3>
          <select v-model.number="songCount" class="input sel" aria-label="Number of songs">
            <option :value="10">Top 10</option>
            <option :value="15">Top 15</option>
            <option :value="25">Top 25</option>
          </select>
        </div>
        <TrackList :tracks="items" @open="(s) => emit('open', s)" />
      </div>
      <div class="card">
        <div class="card-head"><h3>Albums</h3><span class="card-sub">{{ albums.length }}</span></div>
        <div class="albums">
          <button v-for="a in albums" :key="a.id" class="album" @click="emit('open', a)">
            <img v-if="a.artwork" :src="a.artwork" alt="" loading="lazy" />
            <span v-else class="ph">{{ a.name[0] }}</span>
            <span class="name">{{ a.name }}</span>
            <span class="faint">{{ a.year }}</span>
          </button>
        </div>
      </div>
    </div>
    <h3 class="section">Analysis of top songs <span v-if="loading" class="spinner"></span></h3>
    <CollectionAnalysis v-if="withLyrics.length" :songs="withLyrics" @open="(s) => emit('open', s)" />
    <p v-else-if="!loading" class="faint">No lyrics were found for these songs.</p>
  </div>
</template>

<style scoped>
.sel { width: auto; padding: 4px 8px; font-size: 13px; }
.albums { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 12px; max-height: 560px; overflow: auto; }
.album { display: flex; flex-direction: column; gap: 2px; background: none; border: 0; padding: 6px; border-radius: 8px; cursor: pointer; text-align: left; }
.album:hover { background: var(--surface-2); }
.album img, .album .ph { width: 100%; aspect-ratio: 1; border-radius: 6px; object-fit: cover; }
.album .ph { display: grid; place-items: center; background: var(--surface-2); color: var(--text-3); font-size: 28px; font-weight: 700; }
.album .name { font-size: 13px; font-weight: 500; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.section { display: flex; align-items: center; gap: 8px; font-size: 18px; margin-top: 8px; }
</style>
