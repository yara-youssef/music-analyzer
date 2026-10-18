// Lyrics from LRCLIB (free, no key, CORS-enabled), with lyrics.ovh as a fallback.
const CACHE_KEY = 'lyrics-cache-v1'
const memory = new Map()

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeCache(key, value) {
  try {
    const cache = readCache()
    cache[key] = value
    const keys = Object.keys(cache)
    // Keep the cache bounded; drop the oldest entries.
    for (const k of keys.slice(0, Math.max(0, keys.length - 300))) delete cache[k]
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    /* storage unavailable or full: memory cache still works */
  }
}

// "Song (feat. X) - Remastered 2011" -> "Song"
export function simplifyTitle(title) {
  return title
    .replace(/\s*[([](feat|ft|with|from|remaster|live|demo|edit|version|explicit|bonus|taylor)[^)\]]*[)\]]/gi, '')
    .replace(/\s+-\s+.*(remaster|live|version|edit|mix|mono|stereo).*$/i, '')
    .trim()
}

async function getJson(url) {
  const res = await fetch(url)
  if (!res.ok) return null
  return res.json()
}

async function fromLrclib({ title, artist, album, durationSec }) {
  const params = new URLSearchParams({ track_name: title, artist_name: artist })
  if (album) params.set('album_name', album)
  if (durationSec) params.set('duration', durationSec)
  const exact = await getJson(`https://lrclib.net/api/get?${params}`).catch(() => null)
  if (exact?.plainLyrics) return exact.plainLyrics
  if (exact?.instrumental) return ''

  const q = new URLSearchParams({ track_name: title, artist_name: artist })
  const results = await getJson(`https://lrclib.net/api/search?${q}`).catch(() => null)
  const hit = (results || []).find((r) => r.plainLyrics)
  return hit?.plainLyrics ?? null
}

async function fromLyricsOvh({ title, artist }) {
  const data = await getJson(
    `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
  ).catch(() => null)
  return data?.lyrics || null
}

/**
 * Resolve lyrics for a song. Returns the lyric text, '' for instrumentals,
 * or null when no source has them.
 */
export async function fetchLyrics(song) {
  const key = `${song.artist}|${song.title}`.toLowerCase()
  if (memory.has(key)) return memory.get(key)
  const cached = readCache()[key]
  if (cached !== undefined) {
    memory.set(key, cached)
    return cached
  }
  const simple = { ...song, title: simplifyTitle(song.title) }
  let text = await fromLrclib(song)
  if (text == null && simple.title !== song.title) text = await fromLrclib({ ...simple, album: undefined, durationSec: undefined })
  if (text == null) text = await fromLyricsOvh(simple)
  memory.set(key, text)
  if (text != null) writeCache(key, text)
  return text
}

/** Fetch lyrics for many songs with limited concurrency, reporting each as it lands. */
export async function fetchLyricsMany(songs, onEach, concurrency = 4) {
  let next = 0
  async function worker() {
    while (next < songs.length) {
      const i = next++
      let lyrics = null
      try {
        lyrics = await fetchLyrics(songs[i])
      } catch {
        lyrics = null
      }
      onEach(i, lyrics)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, songs.length) }, worker))
}
