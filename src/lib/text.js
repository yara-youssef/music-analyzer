import { STOPWORDS } from './stopwords.js'

// Section markers such as "[Chorus]" or "(Verse 2)" and LRC timestamps are
// metadata, not lyrics.
const SECTION_RE = /^\s*[[(]?(intro|outro|verse|chorus|pre-chorus|bridge|hook|refrain|interlude|instrumental)[^\])]*[\])]?\s*:?\s*$/i
const BRACKET_RE = /^\s*\[[^\]]*\]\s*$/
const TIMESTAMP_RE = /\[\d{1,2}:\d{2}(?:\.\d+)?\]/g

export function cleanLyrics(raw = '') {
  return raw
    .replace(/\r/g, '')
    .replace(TIMESTAMP_RE, '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => !SECTION_RE.test(l) && !BRACKET_RE.test(l))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function lines(text) {
  return cleanLyrics(text)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}

/** Split into stanzas (blank-line separated blocks). */
export function stanzas(text) {
  return cleanLyrics(text)
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Lowercased word tokens; apostrophes kept inside words ("don't") and after a dropped g ("lovin'"). */
export function tokenize(text) {
  return (
    text
      .toLowerCase()
      .replace(/[’‘`]/g, "'")
      .match(/[a-zÀ-ɏ0-9]+(?:['-][a-zÀ-ɏ0-9]+)*'?/g) || []
  )
}

const DROPPED_G = /in'$/ // "lovin'" -> "loving"
export function normalizeWord(w) {
  return w.replace(DROPPED_G, 'ing').replace(/^'+|'+$/g, '')
}

export function contentTokens(text) {
  return tokenize(cleanLyrics(text))
    .map(normalizeWord)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w) && !/^\d+$/.test(w))
}

export function wordFrequencies(text) {
  const freq = new Map()
  for (const w of contentTokens(text)) freq.set(w, (freq.get(w) || 0) + 1)
  return freq
}

export function topWords(freq, n = 20) {
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([word, count]) => ({ word, count }))
}

export function mergeFrequencies(freqs) {
  const out = new Map()
  for (const f of freqs) for (const [w, c] of f) out.set(w, (out.get(w) || 0) + c)
  return out
}

/** Basic descriptive statistics for one lyric text. */
export function textStats(text) {
  const ls = lines(text)
  const all = tokenize(cleanLyrics(text)).map(normalizeWord)
  const unique = new Set(all)
  const lineCounts = new Map()
  for (const l of ls) {
    const key = tokenize(l).join(' ')
    if (key) lineCounts.set(key, (lineCounts.get(key) || 0) + 1)
  }
  const repeatedLines = [...lineCounts.values()].filter((c) => c > 1).reduce((a, c) => a + c, 0)
  return {
    words: all.length,
    uniqueWords: unique.size,
    lines: ls.length,
    stanzas: stanzas(text).length,
    // Type/token ratio is length-sensitive, so also report a moving-window version.
    lexicalDiversity: all.length ? unique.size / all.length : 0,
    mattr: movingTTR(all, 50),
    wordsPerLine: ls.length ? all.length / ls.length : 0,
    repetition: ls.length ? repeatedLines / ls.length : 0,
  }
}

/** Moving-average type/token ratio: comparable across songs of different length. */
export function movingTTR(tokens, window = 50) {
  if (!tokens.length) return 0
  if (tokens.length <= window) return new Set(tokens).size / tokens.length
  let total = 0
  let n = 0
  for (let i = 0; i + window <= tokens.length; i++) {
    total += new Set(tokens.slice(i, i + window)).size / window
    n++
  }
  return total / n
}

/**
 * TF-IDF vectors for a set of documents.
 * Returns { vocab, vectors: Map<word, weight>[] } with each vector L2-normalized.
 */
export function tfidf(texts) {
  const docs = texts.map(wordFrequencies)
  const df = new Map()
  for (const d of docs) for (const w of d.keys()) df.set(w, (df.get(w) || 0) + 1)
  const N = docs.length
  const vectors = docs.map((d) => {
    const v = new Map()
    let norm = 0
    for (const [w, c] of d) {
      const weight = (1 + Math.log(c)) * (Math.log((1 + N) / (1 + df.get(w))) + 1)
      v.set(w, weight)
      norm += weight * weight
    }
    norm = Math.sqrt(norm) || 1
    for (const [w, x] of v) v.set(w, x / norm)
    return v
  })
  return { vectors, df }
}

export function sparseCosine(a, b) {
  let dot = 0
  const [small, big] = a.size < b.size ? [a, b] : [b, a]
  for (const [w, x] of small) {
    const y = big.get(w)
    if (y) dot += x * y
  }
  return dot
}

/** Words that contribute most to the similarity of two TF-IDF vectors. */
export function sharedTerms(a, b, n = 8) {
  const out = []
  for (const [w, x] of a) {
    const y = b.get(w)
    if (y) out.push({ word: w, weight: x * y })
  }
  return out.sort((p, q) => q.weight - p.weight).slice(0, n)
}

/** Words most characteristic of each document relative to the others. */
export function distinctiveTerms(vector, n = 5) {
  return [...vector.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([w]) => w)
}
