import { afinn165 } from 'afinn-165'
import { cleanLyrics, lines, tokenize, normalizeWord } from './text.js'

const NEGATORS = new Set([
  'not', 'no', 'never', "don't", "can't", "won't", "isn't", "ain't", "didn't", "doesn't",
  "wasn't", "weren't", "couldn't", "wouldn't", "shouldn't", 'nobody', 'nothing', 'cannot', 'dont', 'cant',
])

/** Per-token AFINN scores, flipping the sign when a negator appears within two words before. */
export function scoreTokens(tokens) {
  return tokens.map((raw, i) => {
    const w = normalizeWord(raw)
    const s = afinn165[w] || 0
    if (!s) return 0
    const negated = NEGATORS.has(tokens[i - 1]) || NEGATORS.has(tokens[i - 2])
    return negated ? -s : s
  })
}

/**
 * Overall sentiment for a text.
 * `comparative` is score per word (roughly -1..1 for lyrics), the number to compare songs by.
 */
export function sentiment(text) {
  const tokens = tokenize(cleanLyrics(text))
  const scores = scoreTokens(tokens)
  const positive = new Map()
  const negative = new Map()
  let score = 0
  scores.forEach((s, i) => {
    score += s
    const w = normalizeWord(tokens[i])
    if (s > 0) positive.set(w, (positive.get(w) || 0) + 1)
    if (s < 0) negative.set(w, (negative.get(w) || 0) + 1)
  })
  return {
    score,
    comparative: tokens.length ? score / tokens.length : 0,
    positive,
    negative,
  }
}

/** Sentiment of each word in isolation, used to tint the word cloud. */
export function wordPolarity(word) {
  return afinn165[word] || 0
}

/**
 * Emotional arc through a song: mean AFINN score over a sliding window of lines.
 * Returns one point per line: { index, value, line }.
 */
export function sentimentArc(text, window = 4) {
  const ls = lines(text)
  const perLine = ls.map((l) => {
    const toks = tokenize(l)
    const s = scoreTokens(toks)
    return { sum: s.reduce((a, b) => a + b, 0), n: toks.length }
  })
  return ls.map((line, i) => {
    const from = Math.max(0, i - Math.floor(window / 2))
    const to = Math.min(ls.length, from + window)
    let sum = 0
    let n = 0
    for (let j = from; j < to; j++) {
      sum += perLine[j].sum
      n += perLine[j].n
    }
    return { index: i, value: n ? sum / n : 0, line }
  })
}
