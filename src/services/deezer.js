// Deezer public API (free, no key), used when iTunes can't be reached. No CORS,
// so requests go through JSONP. IDs are prefixed "dz:" so lookups route back here.
import { jsonp } from './jsonp.js'

export const PREFIX = 'dz:'
const BASE = 'https://api.deezer.com'
const strip = (id) => String(id).slice(PREFIX.length)

async function get(path, params = {}) {
  const data = await jsonp(`${BASE}${path}`, { ...params, output: 'jsonp' })
  // Deezer reports errors (including quota limits) as a 200 with an error body.
  if (data?.error) throw new Error(data.error.message || 'error response')
  return data
}

function toArtist(r) {
  return { type: 'artist', id: PREFIX + r.id, name: r.name, artwork: r.picture_medium, genre: r.nb_fan ? `${r.nb_fan.toLocaleString()} fans` : undefined }
}

function toAlbum(r, artist = r.artist) {
  return {
    type: 'album',
    id: PREFIX + r.id,
    name: r.title,
    artist: artist?.name,
    artistId: artist ? PREFIX + artist.id : undefined,
    artwork: r.cover_medium,
    year: r.release_date?.slice(0, 4),
  }
}

function toSong(r, album = r.album) {
  return {
    type: 'song',
    id: PREFIX + r.id,
    title: r.title,
    artist: r.artist?.name,
    artistId: r.artist ? PREFIX + r.artist.id : undefined,
    album: album?.title,
    albumId: album ? PREFIX + album.id : undefined,
    artwork: album?.cover_medium,
    durationSec: r.duration || undefined,
    trackNumber: r.track_position,
    discNumber: r.disk_number,
  }
}

export async function search(term, type) {
  const { data = [] } = await get(`/search/${type === 'song' ? 'track' : type}`, { q: term, limit: 25 })
  if (type === 'artist') return data.map(toArtist)
  if (type === 'album') return data.map((r) => toAlbum(r))
  return data.map((r) => toSong(r))
}

export async function artistAlbums(artistId) {
  const id = strip(artistId)
  const [artist, { data = [] }] = await Promise.all([get(`/artist/${id}`), get(`/artist/${id}/albums`, { limit: 200 })])
  // Prefer albums and EPs; fall back to everything (singles) for artists with none.
  const main = data.filter((a) => a.record_type === 'album' || a.record_type === 'ep')
  return (main.length ? main : data).map((a) => toAlbum(a, artist))
}

/** Deezer's top tracks are ranked by popularity. */
export async function artistTopSongs(artistId, limit) {
  const { data = [] } = await get(`/artist/${strip(artistId)}/top`, { limit: limit * 2 })
  return data.map((r) => toSong(r))
}

export async function albumTracks(albumId) {
  const album = await get(`/album/${strip(albumId)}`)
  return (album.tracks?.data || []).map((r, i) => ({ ...toSong(r, album), trackNumber: r.track_position ?? i + 1 }))
}
