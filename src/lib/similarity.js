import { stanzas, tfidf, sparseCosine, sharedTerms } from './text.js'

// Transformers.js is loaded from a CDN on first use so the ~1 MB library and the
// ~23 MB model are only downloaded by people who ask for semantic comparison.
const TRANSFORMERS_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/+esm'
const MODEL = 'Xenova/all-MiniLM-L6-v2'

let extractorPromise = null

function getExtractor(onProgress) {
  if (!extractorPromise) {
    extractorPromise = import(/* @vite-ignore */ TRANSFORMERS_URL)
      .then(({ pipeline }) =>
        pipeline('feature-extraction', MODEL, {
          progress_callback: (p) => onProgress?.(p),
        }),
      )
      .catch((e) => {
        extractorPromise = null
        throw e
      })
  }
  return extractorPromise
}

function normalize(v) {
  const n = Math.hypot(...v) || 1
  return v.map((x) => x / n)
}

export function cosine(a, b) {
  let dot = 0
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i]
  return dot
}

const embeddingCache = new Map()

/**
 * Sentence-embedding of a whole song. The model reads at most ~256 tokens, so
 * each stanza is embedded separately and the stanza vectors are averaged.
 */
export async function embedSong(song, onProgress) {
  if (embeddingCache.has(song.id)) return embeddingCache.get(song.id)
  const extractor = await getExtractor(onProgress)
  const chunks = stanzas(song.lyrics).flatMap((s) => {
    // Very long "stanzas" (lyrics with no blank lines) get split every 8 lines.
    const ls = s.split('\n')
    const out = []
    for (let i = 0; i < ls.length; i += 8) out.push(ls.slice(i, i + 8).join('\n'))
    return out
  })
  if (!chunks.length) chunks.push(song.title)
  const output = await extractor(chunks, { pooling: 'mean', normalize: true })
  const rows = output.tolist()
  const mean = rows[0].map((_, d) => rows.reduce((a, r) => a + r[d], 0) / rows.length)
  const vec = normalize(mean)
  embeddingCache.set(song.id, vec)
  return vec
}

/**
 * Pairwise similarity for a list of songs.
 * method: 'semantic' (meaning, via embeddings) or 'lexical' (shared vocabulary, via TF-IDF).
 */
export async function compareSongs(songs, method, onProgress) {
  const { vectors: tf } = tfidf(songs.map((s) => s.lyrics))
  let matrix
  let points
  if (method === 'semantic') {
    const vecs = []
    for (let i = 0; i < songs.length; i++) {
      vecs.push(await embedSong(songs[i], onProgress))
      onProgress?.({ status: 'embedded', done: i + 1, total: songs.length })
    }
    matrix = vecs.map((a) => vecs.map((b) => cosine(a, b)))
    points = pca2d(vecs)
  } else {
    matrix = tf.map((a) => tf.map((b) => sparseCosine(a, b)))
    points = mds2d(matrix)
  }
  const pairs = []
  for (let i = 0; i < songs.length; i++)
    for (let j = i + 1; j < songs.length; j++)
      pairs.push({ i, j, value: matrix[i][j], shared: sharedTerms(tf[i], tf[j]).map((t) => t.word) })
  pairs.sort((a, b) => b.value - a.value)
  return { matrix, points, pairs, tfidf: tf }
}

// ---- 2D projections -------------------------------------------------------

function powerIteration(mat, deflate = []) {
  const n = mat.length
  let v = Array.from({ length: n }, (_, i) => Math.sin(i + 1))
  for (let iter = 0; iter < 200; iter++) {
    let w = mat.map((row) => row.reduce((a, x, j) => a + x * v[j], 0))
    for (const u of deflate) {
      const d = w.reduce((a, x, i) => a + x * u[i], 0)
      w = w.map((x, i) => x - d * u[i])
    }
    const norm = Math.hypot(...w) || 1
    v = w.map((x) => x / norm)
  }
  const lambda = mat.reduce((a, row, i) => a + v[i] * row.reduce((b, x, j) => b + x * v[j], 0), 0)
  return { v, lambda }
}

/** Classical multidimensional scaling from a similarity matrix (distance = 1 - sim). */
export function mds2d(sim) {
  const n = sim.length
  if (n < 2) return sim.map(() => [0, 0])
  const d2 = sim.map((row) => row.map((s) => Math.pow(Math.max(0, 1 - s), 2)))
  const rowMean = d2.map((r) => r.reduce((a, b) => a + b, 0) / n)
  const all = rowMean.reduce((a, b) => a + b, 0) / n
  const B = d2.map((r, i) => r.map((x, j) => -0.5 * (x - rowMean[i] - rowMean[j] + all)))
  const e1 = powerIteration(B)
  const e2 = powerIteration(B, [e1.v])
  const s1 = Math.sqrt(Math.max(e1.lambda, 0))
  const s2 = Math.sqrt(Math.max(e2.lambda, 0))
  return e1.v.map((x, i) => [x * s1, e2.v[i] * s2])
}

/** PCA of dense vectors via the Gram matrix (cheap when songs << dimensions). */
export function pca2d(vecs) {
  const n = vecs.length
  if (n < 2) return vecs.map(() => [0, 0])
  const dim = vecs[0].length
  const mean = Array.from({ length: dim }, (_, d) => vecs.reduce((a, v) => a + v[d], 0) / n)
  const centered = vecs.map((v) => v.map((x, d) => x - mean[d]))
  const gram = centered.map((a) => centered.map((b) => cosineRaw(a, b)))
  const e1 = powerIteration(gram)
  const e2 = powerIteration(gram, [e1.v])
  const s1 = Math.sqrt(Math.max(e1.lambda, 0))
  const s2 = Math.sqrt(Math.max(e2.lambda, 0))
  return e1.v.map((x, i) => [x * s1, e2.v[i] * s2])
}

function cosineRaw(a, b) {
  let dot = 0
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i]
  return dot
}
