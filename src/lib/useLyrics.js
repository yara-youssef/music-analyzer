import { reactive, ref } from 'vue'
import { fetchLyricsMany } from '@/services/lyrics.js'

/**
 * Loads lyrics for a list of songs. `items` holds each song with
 * status 'loading' | 'ok' | 'missing' | 'instrumental' and its lyrics.
 */
export function useLyrics() {
  const items = ref([])
  const loading = ref(false)
  let generation = 0

  async function load(songs) {
    const gen = ++generation
    items.value = songs.map((s) => reactive({ ...s, status: 'loading', lyrics: null }))
    loading.value = true
    await fetchLyricsMany(songs, (i, lyrics) => {
      if (gen !== generation) return
      const it = items.value[i]
      it.lyrics = lyrics
      it.status = lyrics == null ? 'missing' : lyrics.trim() ? 'ok' : 'instrumental'
    })
    if (gen === generation) loading.value = false
  }

  return { items, loading, load }
}
