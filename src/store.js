import { reactive, watch } from 'vue'

const KEY = 'music-analyzer-compare-v1'

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

// Songs (with lyrics) queued for side-by-side comparison, plus pasted lyrics.
export const store = reactive({
  compare: load(),
})

watch(
  () => store.compare,
  (list) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(list))
    } catch {
      /* ignore */
    }
  },
  { deep: true },
)

export function inCompare(id) {
  return store.compare.some((s) => s.id === id)
}

export function addToCompare(song) {
  if (!song.lyrics || inCompare(song.id)) return
  const { id, title, artist, album, artwork, lyrics, source } = song
  store.compare.push({ id, title, artist, album, artwork, lyrics, source })
}

export function removeFromCompare(id) {
  const i = store.compare.findIndex((s) => s.id === id)
  if (i >= 0) store.compare.splice(i, 1)
}

export function toggleCompare(song) {
  inCompare(song.id) ? removeFromCompare(song.id) : addToCompare(song)
}
