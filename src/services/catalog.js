// Artist / album / song metadata. iTunes is the primary source; Deezer is a
// fallback for when iTunes is unreachable (e.g. Apple rate-limits a shared
// mobile-carrier IP, or a content blocker stops the request).
import * as itunes from './itunes.js'
import * as deezer from './deezer.js'

const PROVIDERS = [
  { name: 'iTunes', api: itunes },
  { name: 'Deezer', api: deezer },
]
// After a fallback succeeds, try that provider first for the rest of the session.
let preferred = 0

const providerFor = (id) => (String(id).startsWith(deezer.PREFIX) ? deezer : itunes)

// The same album or song often appears twice (explicit + clean); keep the first.
function dedupe(items, key) {
  const seen = new Set()
  return items.filter((it) => {
    const k = key(it)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

export async function search(term, type) {
  const order = [PROVIDERS[preferred], ...PROVIDERS.filter((_, i) => i !== preferred)]
  const failures = []
  for (const p of order) {
    try {
      const results = await p.api.search(term, type)
      preferred = PROVIDERS.indexOf(p)
      if (type === 'album') return dedupe(results, (a) => `${a.artist}|${a.name}`.toLowerCase())
      if (type === 'song') return dedupe(results, (s) => `${s.artist}|${s.title}`.toLowerCase())
      return results
    } catch (e) {
      failures.push(`${p.name}: ${e.message}`)
    }
  }
  throw new Error(`Could not reach the music catalog (${failures.join('; ')}). Check your connection or try another network.`)
}

export async function artistAlbums(artistId) {
  const albums = await providerFor(artistId).artistAlbums(artistId)
  return dedupe(albums, (a) => a.name.toLowerCase()).sort((a, b) => (b.year || '').localeCompare(a.year || ''))
}

export async function artistTopSongs(artistId, limit = 15) {
  const songs = await providerFor(artistId).artistTopSongs(artistId, limit)
  return dedupe(songs, (s) => s.title.toLowerCase().replace(/\s*[([].*$/, '')).slice(0, limit)
}

export function albumTracks(albumId) {
  return providerFor(albumId).albumTracks(albumId)
}
