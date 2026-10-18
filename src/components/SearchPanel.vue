<script setup>
import { ref, watch } from 'vue'
import { search } from '@/services/catalog.js'

const emit = defineEmits(['select'])
const type = ref('artist')
const term = ref('')
const results = ref([])
const loading = ref(false)
const error = ref('')
const searched = ref('')

async function run() {
  const q = term.value.trim()
  if (!q) return
  loading.value = true
  error.value = ''
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

function subtitle(r) {
  if (r.type === 'artist') return r.genre || 'Artist'
  if (r.type === 'album') return [r.artist, r.year].filter(Boolean).join(' · ')
  return [r.artist, r.album].filter(Boolean).join(' · ')
}
</script>

<template>
  <div class="card search">
    <div class="segmented" role="tablist">
      <button v-for="t in ['artist', 'album', 'song']" :key="t" :class="{ active: type === t }" @click="type = t">
        {{ t[0].toUpperCase() + t.slice(1) }}
      </button>
    </div>
    <form class="row" @submit.prevent="run">
      <input v-model="term" class="input" :placeholder="`Search for ${type === 'artist' ? 'an artist' : `a${type === 'album' ? 'n album' : ' song'}`}…`" autofocus />
      <button class="btn primary" :disabled="loading">
        <span v-if="loading" class="spinner"></span>Search
      </button>
    </form>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-else-if="searched && !loading && !results.length" class="faint">No results for “{{ searched }}”.</p>
    <ul v-if="results.length" class="results">
      <li v-for="r in results" :key="r.type + r.id">
        <button @click="emit('select', r)">
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
</template>

<style scoped>
.search { display: flex; flex-direction: column; gap: 12px; }
.search form { flex-wrap: nowrap; }
.results { list-style: none; padding: 0; margin: 0; max-height: 60vh; overflow: auto; }
.results button { display: flex; align-items: center; gap: 10px; width: 100%; background: none; border: 0; padding: 7px; border-radius: 8px; cursor: pointer; text-align: left; }
.results button:hover { background: var(--surface-2); }
.results img, .ph { width: 40px; height: 40px; border-radius: 6px; flex: none; object-fit: cover; }
.ph { display: grid; place-items: center; background: var(--surface-2); color: var(--text-3); font-weight: 600; }
.txt { display: flex; flex-direction: column; min-width: 0; }
.txt span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.name { font-weight: 500; }
</style>
