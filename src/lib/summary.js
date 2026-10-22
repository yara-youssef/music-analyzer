import { textStats, wordFrequencies, topWords } from './text.js'
import { sentiment, sentimentArc } from './sentiment.js'
import { pct, signed, num, moodLabel } from './format.js'

/** Everything the single-song views show, computed once per lyric text. */
export function songSummary(lyrics) {
  const stats = textStats(lyrics)
  const freq = wordFrequencies(lyrics)
  const sent = sentiment(lyrics)
  return {
    stats,
    sent,
    arc: sentimentArc(lyrics),
    cloudWords: topWords(freq, 90),
    tiles: [
      { label: 'Words', value: num(stats.words), hint: `${stats.lines} lines · ${stats.stanzas} stanzas` },
      { label: 'Unique words', value: num(stats.uniqueWords) },
      { label: 'Vocabulary richness', value: pct(stats.mattr), hint: 'distinct words per 50-word window' },
      { label: 'Repeated lines', value: pct(stats.repetition), hint: 'share of lines that recur' },
      { label: 'Mood', value: signed(sent.comparative), hint: moodLabel(sent.comparative) },
    ],
    top: (n = 15) => topWords(freq, n).map((d) => ({ label: d.word, value: d.count })),
    emotive: (n = 6) => {
      const toItems = (m, sign) =>
        [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([w, c]) => ({ label: w, value: sign * c, note: `${c}× in the song` }))
      return [...toItems(sent.positive, 1), ...toItems(sent.negative, -1)].sort((a, b) => b.value - a.value)
    },
  }
}
