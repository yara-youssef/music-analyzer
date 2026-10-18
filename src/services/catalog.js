// Artist / album / song metadata from the iTunes Search API (free, no key).
// The API's CORS headers are unreliable, so requests go through JSONP.
const BASE = 'https://itunes.apple.com'
let jsonpId = 0

function jsonp(path, params) {
  return new Promise((resolve, reject) => {
    const cb = `__itunes_cb_${Date.now()}_${jsonpId++}`
    const qs = new URLSearchParams({ ...params, callback: cb })
    const script = document.createElement('script')
    const timer = setTimeout(() => finish(new Error('Music catalog request timed out')), 15000)
    function finish(err, data) {
      clearTimeout(timer)
      delete window[cb]
      script.remove()
      err ? reject(err) : resolve(data)
    }
    window[cb] = (data) => finish(null, data)
    script.onerror = () => finish(new Error('Could not reach the music catalog'))
    script.src = `${BASE}${path}?${qs}`
    document.head.appendChild(script)
  })
}

const art = (url, size = 300) => url?.replace(/\/\d+x\d+bb\./, `/${size}x${size}bb.`)

function toArtist(r) {
  return { type: 'artist', id: String(r.artistId), name: r.artistName, genre: r.primaryGenreName }
}

function toAlbum(r) {
  return {
    type: 'album',
    id: String(r.collectionId),
    name: r.collectionName,
    artist: r.artistName,
    artistId: String(r.artistId),
    artwork: art(r.artworkUrl100),
    year: r.releaseDate?.slice(0, 4),
    trackCount: r.trackCount,
  }
}

export function toSong(r) {
  return {
    type: 'song',
    id: String(r.trackId),
    title: r.trackName,
    artist: r.artistName,
    artistId: String(r.artistId),
    album: r.collectionName,
    albumId: String(r.collectionId),
    artwork: art(r.artworkUrl100),
    durationSec: r.trackTimeMillis ? Math.round(r.trackTimeMillis / 1000) : undefined,
    trackNumber: r.trackNumber,
    discNumber: r.discNumber,
  }
}

const isSong = (r) => r.wrapperType === 'track' && r.kind === 'song'
const isAlbum = (r) => r.wrapperType === 'collection'

// The same album often appears twice (explicit + clean); keep the first.
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
  const entity = { artist: 'musicArtist', album: 'album', song: 'song' }[type]
  const data = await jsonp('/search', { term, media: 'music', entity, limit: 25 })
  const r = data.results || []
  if (type === 'artist') return r.filter((x) => x.artistId).map(toArtist)
  if (type === 'album') return dedupe(r.filter(isAlbum).map(toAlbum), (a) => `${a.artist}|${a.name}`.toLowerCase())
  return dedupe(r.filter(isSong).map(toSong), (s) => `${s.artist}|${s.title}`.toLowerCase())
}

export async function artistAlbums(artistId) {
  const data = await jsonp('/lookup', { id: artistId, entity: 'album', limit: 200 })
  const albums = (data.results || []).filter(isAlbum).map(toAlbum)
  return dedupe(albums, (a) => a.name.toLowerCase()).sort((a, b) => (b.year || '').localeCompare(a.year || ''))
}

/** iTunes returns an artist's songs roughly in popularity order. */
export async function artistTopSongs(artistId, limit = 15) {
  const data = await jsonp('/lookup', { id: artistId, entity: 'song', limit: limit * 2 })
  const songs = (data.results || []).filter(isSong).map(toSong)
  return dedupe(songs, (s) => s.title.toLowerCase().replace(/\s*[([].*$/, '')).slice(0, limit)
}

export async function albumTracks(albumId) {
  const data = await jsonp('/lookup', { id: albumId, entity: 'song' })
  return (data.results || [])
    .filter(isSong)
    .map(toSong)
    .sort((a, b) => (a.discNumber - b.discNumber) || (a.trackNumber - b.trackNumber))
}
