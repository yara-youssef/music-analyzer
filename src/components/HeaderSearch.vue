<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { search } from '@/services/catalog.js'

// Search box in the top bar. Results open in a dropdown that closes when a
// result is picked, on Escape, or on a click/tap outside.
const emit = defineEmits(['select'])
const type = ref('artist')
const term = ref('')
const results = ref([])
const loading = ref(false)
const error = ref('')
const searched = ref('')
const open = ref(false)
const root = ref(null)
const list = ref(null)

async function run() {
  const q = term.value.trim()
  if (!q) return
  loading.value = true
  error.value = ''
  open.value = true
  try {
    results.value = await search(q, type.value)
    searched.value = q
  } catch (e) {
    error.value = e.message
    results.value = []
  } finally {
    loading.value = false
  }
}
watch(type, () => term.value.trim() && run())

function pick(r) {
  open.value = false
  document.activeElement?.blur()
  emit('select', r)
}
function reopen() {
  if (searched.value && searched.value === term.value.trim()) open.value = true
}
// Arrow keys move between results; Escape closes the dropdown.
function onKey(e) {
  if (e.key === 'Escape') {
    // Search inputs clear their text on Escape by default; keep the query, just close.
    e.preventDefault()
    open.value = false
    return
  }
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
  const buttons = [...(list.value?.querySelectorAll('button') || [])]
  if (!open.value || !buttons.length) return
  e.preventDefault()
  const i = buttons.indexOf(document.activeElement)
  const next = e.key === 'ArrowDown' ? Math.min(buttons.length - 1, i + 1) : i - 1
  next < 0 ? root.value.querySelector('input').focus() : buttons[next].focus()
}
function onOutside(e) {
  if (open.value && root.value && !root.value.contains(e.target)) open.value = false
}
onMounted(() => document.addEventListener('pointerdown', onOutside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutside))

function subtitle(r) {
  if (r.type === 'artist') return r.genre || 'Artist'
  if (r.type === 'album') return [r.artist, r.year].filter(Boolean).join(' · ')
  return [r.artist, r.album].filter(Boolean).join(' · ')
}
const placeholder = { artist: 'Search artists…', album: 'Search albums…', song: 'Search songs…' }
</script>

<template>
  <div ref="root" class="hsearch" @keydown="onKey">
    <form class="bar" role="search" @submit.prevent="run">
      <select v-model="type" class="type" aria-label="Search for">
        <option value="artist">Artist</option>
        <option value="album">Album</option>
        <option value="song">Song</option>
      </select>
      <input v-model="term" class="q" type="search" :placeholder="placeholder[type]" aria-label="Search"
        enterkeyhint="search" @focus="reopen" @click="reopen" />
      <button class="go" :disabled="loading" aria-label="Search">
        <span v-if="loading" class="spinner"></span>
        <svg v-else width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" stroke-width="1.8" />
          <path d="M11 11l3.5 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      </button>
    </form>
    <div v-if="open && (results.length || error || (searched && !loading))" class="dropdown">
      <p v-if="error" class="error msg">{{ error }}</p>
      <p v-else-if="!results.length && !loading" class="faint msg">No results for “{{ searched }}”.</p>
      <ul v-else ref="list" class="results">
        <li v-for="r in results" :key="r.type + r.id">
          <button @click="pick(r)">
            <img v-if="r.artwork" :src="r.artwork" alt="" loading="lazy" />
            <span v-else class="ph">{{ (r.name || r.title)[0] }}</span>
            <span class="txt">
              <span class="name">{{ r.name || r.title }}</span>
              <span class="faint">{{ subtitle(r) }}</span>
            </span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.hsearch { position: relative; flex: 1; max-width: 560px; min-width: 0; }
.bar {
  display: flex; align-items: center; background: var(--surface); border: 1px solid var(--border);
  border-radius: 10px; overflow: hidden;
}
.bar:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent); }
.type {
  border: 0; background: var(--surface-2); padding: 8px 6px 8px 10px; font-size: 14px; color: var(--text-2);
  border-right: 1px solid var(--border); cursor: pointer; outline: none; align-self: stretch;
}
.q { flex: 1; min-width: 0; border: 0; background: none; padding: 8px 10px; outline: none; font-size: 15px; }
.q::-webkit-search-cancel-button { cursor: pointer; }
.go {
  border: 0; background: none; color: var(--text-2); padding: 0 12px; align-self: stretch;
  display: grid; place-items: center; cursor: pointer;
}
.go:hover { color: var(--accent); }
.dropdown {
  position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 20;
  background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
  box-shadow: 0 8px 30px rgb(0 0 0 / 0.14); padding: 6px; max-height: min(60vh, 520px); overflow: auto;
}
.msg { margin: 8px 10px; }
.results { list-style: none; padding: 0; margin: 0; }
.results button {
  display: flex; align-items: center; gap: 10px; width: 100%; background: none; border: 0; padding: 7px;
  border-radius: 8px; cursor: pointer; text-align: left; outline: none;
}
.results button:hover, .results button:focus-visible { background: var(--surface-2); }
.results img, .ph { width: 40px; height: 40px; border-radius: 6px; flex: none; object-fit: cover; }
.ph { display: grid; place-items: center; background: var(--surface-2); color: var(--text-3); font-weight: 600; }
.txt { display: flex; flex-direction: column; min-width: 0; }
.txt span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.name { font-weight: 500; }
</style>
