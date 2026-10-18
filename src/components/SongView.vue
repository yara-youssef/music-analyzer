<script setup>
import { computed, ref, watch } from 'vue'
import EntityHeader from './EntityHeader.vue'
import SongAnalysis from './SongAnalysis.vue'
import { fetchLyrics } from '@/services/lyrics.js'
import { inCompare, toggleCompare } from '@/store.js'

const props = defineProps({ song: { type: Object, required: true } })
const emit = defineEmits(['open'])
const lyrics = ref(null)
const status = ref('loading')
const manual = ref('')

async function init() {
  manual.value = ''
  if (props.song.lyrics) {
    lyrics.value = props.song.lyrics
    status.value = 'ok'
    return
  }
  status.value = 'loading'
  lyrics.value = null
  try {
    const text = await fetchLyrics(props.song)
    lyrics.value = text
    status.value = text == null ? 'missing' : text.trim() ? 'ok' : 'instrumental'
  } catch {
    status.value = 'missing'
  }
}
watch(() => props.song.id, init, { immediate: true })

function useManual() {
  lyrics.value = manual.value
  status.value = 'ok'
}
const full = computed(() => ({ ...props.song, lyrics: lyrics.value, source: props.song.source || 'catalog' }))
</script>

<template>
  <div class="stack">
    <EntityHeader kind="Song" :title="song.title" :subtitle="[song.artist, song.album].filter(Boolean).join(' · ')" :artwork="song.artwork">
      <button v-if="song.albumId" class="btn" @click="emit('open', { type: 'album', id: song.albumId, name: song.album, artist: song.artist, artistId: song.artistId, artwork: song.artwork })">View album</button>
      <button class="btn" :class="{ on: inCompare(song.id) }" :disabled="status !== 'ok'" @click="toggleCompare(full)">
        {{ inCompare(song.id) ? '✓ In compare' : '+ Add to compare' }}
      </button>
    </EntityHeader>
    <div v-if="status === 'loading'" class="card faint"><span class="spinner"></span> Fetching lyrics…</div>
    <div v-else-if="status !== 'ok'" class="card stack">
      <p class="muted" style="margin: 0">
        {{ status === 'instrumental' ? 'This track is listed as instrumental.' : 'Lyrics for this song could not be found automatically.' }}
        You can paste them here instead:
      </p>
      <textarea v-model="manual" class="input" rows="10" placeholder="Paste lyrics…"></textarea>
      <div><button class="btn primary" :disabled="!manual.trim()" @click="useManual">Analyze these lyrics</button></div>
    </div>
    <SongAnalysis v-else :lyrics="lyrics" />
  </div>
</template>
