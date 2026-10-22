<script setup>
import { ref } from 'vue'
import AppLogo from './components/AppLogo.vue'
import HeaderSearch from './components/HeaderSearch.vue'
import ArtistView from './components/ArtistView.vue'
import AlbumView from './components/AlbumView.vue'
import SongView from './components/SongView.vue'
import PasteView from './components/PasteView.vue'
import CompareView from './components/CompareView.vue'
import { store } from './store.js'

const tab = ref('explore')
// Navigation trail inside Explore: artist → album → song.
const trail = ref([])
const current = () => trail.value[trail.value.length - 1]

function open(entity) {
  tab.value = 'explore'
  const type = entity.type || 'song'
  const item = { ...entity, type }
  const existing = trail.value.findIndex((e) => e.type === type && e.id === item.id)
  if (existing >= 0) trail.value = trail.value.slice(0, existing + 1)
  else trail.value = [...trail.value, item]
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
function start(entity) {
  trail.value = []
  open(entity)
}
const crumb = (e) => e.name || e.title
</script>

<template>
  <div class="app">
    <nav class="top">
      <div class="brand" @click="tab = 'explore'; trail = []">
        <AppLogo />
        <span class="brand-name">Lyric Lens</span>
      </div>
      <HeaderSearch class="search" @select="start" />
      <div class="tabs">
        <button :class="{ active: tab === 'explore' }" @click="tab = 'explore'">Explore</button>
        <button :class="{ active: tab === 'paste' }" @click="tab = 'paste'">Paste lyrics</button>
        <button :class="{ active: tab === 'compare' }" @click="tab = 'compare'">
          Compare <span v-if="store.compare.length" class="badge">{{ store.compare.length }}</span>
        </button>
      </div>
    </nav>

    <main>
      <template v-if="tab === 'explore'">
        <div class="explore">
          <section class="content">
            <div v-if="!trail.length" class="empty card">
              <h2>Explore the words behind the music</h2>
              <p class="muted">
                Use the search bar at the top to find an artist, album or song and see its word cloud, emotional arc, vocabulary and repetition
                patterns. Add songs to <b>Compare</b> to see how close they are in meaning, or paste your own lyrics.
              </p>
            </div>
            <template v-else>
              <div class="crumbs">
                <template v-for="(e, i) in trail" :key="e.type + e.id">
                  <span v-if="i" class="faint">/</span>
                  <button :class="{ cur: i === trail.length - 1 }" @click="open(e)">{{ crumb(e) }}</button>
                </template>
              </div>
              <ArtistView v-if="current().type === 'artist'" :key="'a' + current().id" :artist="current()" @open="open" />
              <AlbumView v-else-if="current().type === 'album'" :key="'l' + current().id" :album="current()" @open="open" />
              <SongView v-else :key="'s' + current().id" :song="current()" @open="open" />
            </template>
          </section>
        </div>
      </template>
      <PasteView v-else-if="tab === 'paste'" />
      <CompareView v-else @paste="tab = 'paste'" @open="open" />
    </main>
    <footer class="faint">
      Catalog data from the iTunes Search API · lyrics from LRCLIB and lyrics.ovh · sentiment from the AFINN-165 lexicon
    </footer>
  </div>
</template>

<style scoped>
.top {
  position: sticky; top: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 10px 24px; background: color-mix(in srgb, var(--bg) 85%, transparent); backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border); flex-wrap: wrap;
}
.brand { flex: none; display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 17px; cursor: pointer; color: var(--text); }
.tabs { flex: none; display: flex; gap: 4px; }
.tabs button { border: 0; background: none; padding: 7px 12px; border-radius: 8px; cursor: pointer; color: var(--text-2); font-weight: 500; display: inline-flex; align-items: center; gap: 6px; }
.tabs button:hover { background: var(--surface-2); }
.tabs button.active { color: var(--text); background: var(--surface-2); }
.badge { background: var(--accent); color: var(--accent-ink); border-radius: 999px; font-size: 11px; padding: 0 7px; line-height: 18px; }
main { max-width: 1320px; margin: 0 auto; padding: 24px; }
.content { min-width: 0; }
.empty { padding: 40px; }
.empty p { max-width: 560px; margin: 12px 0 0; }
.crumbs { display: flex; gap: 6px; align-items: center; margin-bottom: 14px; flex-wrap: wrap; }
.crumbs button { border: 0; background: none; color: var(--accent); cursor: pointer; padding: 2px 4px; }
.crumbs button.cur { color: var(--text-2); cursor: default; }
footer { text-align: center; padding: 24px 16px 32px; }
@media (max-width: 900px) {
  /* Phone / narrow: logo and tabs on the first row, full-width search below. */
  .search { order: 3; flex-basis: 100%; max-width: none; }
  main { padding: 16px; }
  .top { padding: 10px 16px; }
}
/* Small phones: icon-only logo so the logo and tabs share one row above the search. */
@media (max-width: 480px) {
  .brand-name { display: none; }
  .tabs button { padding: 7px 9px; }
}
</style>
