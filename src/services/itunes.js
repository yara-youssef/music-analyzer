// iTunes Search API (free, no key). Its CORS headers are unreliable, so requests go through JSONP.
import { jsonp } from './jsonp.js'

const BASE = 'https://itunes.apple.com'
const get = (path, params) => jsonp(`${BASE}${path}`, params)

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

function toSong(r) {
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

export async function search(term, type) {
  const entity = { artist: 'musicArtist', album: 'album', song: 'song' }[type]
  const r = (await get('/search', { term, media: 'music', entity, limit: 25 })).results || []
  if (type === 'artist') return r.filter((x) => x.artistId).map(toArtist)
  if (type === 'album') return r.filter(isAlbum).map(toAlbum)
  return r.filter(isSong).map(toSong)
}

export async function artistAlbums(artistId) {
  const data = await get('/lookup', { id: artistId, entity: 'album', limit: 200 })
  return (data.results || []).filter(isAlbum).map(toAlbum)
}

/** iTunes returns an artist's songs roughly in popularity order. */
export async function artistTopSongs(artistId, limit) {
  const data = await get('/lookup', { id: artistId, entity: 'song', limit: limit * 2 })
  return (data.results || []).filter(isSong).map(toSong)
}

export async function albumTracks(albumId) {
  const data = await get('/lookup', { id: albumId, entity: 'song' })
  return (data.results || [])
    .filter(isSong)
    .map(toSong)
    .sort((a, b) => (a.discNumber - b.discNumber) || (a.trackNumber - b.trackNumber))
}
