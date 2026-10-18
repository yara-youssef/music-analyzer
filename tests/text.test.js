import { describe, it, expect } from 'vitest'
import { cleanLyrics, contentTokens, textStats, tfidf, sparseCosine, topWords, wordFrequencies, movingTTR } from '../src/lib/text.js'
import { sentiment, sentimentArc } from '../src/lib/sentiment.js'
import { mds2d, pca2d } from '../src/lib/similarity.js'
import { simplifyTitle } from '../src/services/lyrics.js'

describe('text', () => {
  it('strips section headers and timestamps', () => {
    expect(cleanLyrics('[Chorus]\n[00:12.30]Hello there\n(Verse 2)\nbye')).toBe('Hello there\nbye')
  })

  it('drops stopwords and filler, normalizes dropped g', () => {
    expect(contentTokens("Oh yeah, I'm lovin' the night, don't stop")).toEqual(['loving', 'night', 'stop'])
  })

  it('counts words and repeated lines', () => {
    const s = textStats('love me tender\nlove me true\n\nlove me tender')
    expect(s.words).toBe(9)
    expect(s.lines).toBe(3)
    expect(s.stanzas).toBe(2)
    expect(s.repetition).toBeCloseTo(2 / 3)
  })

  it('ranks top words by frequency', () => {
    expect(topWords(wordFrequencies('fire fire rain fire rain sun'), 2)).toEqual([
      { word: 'fire', count: 3 },
      { word: 'rain', count: 2 },
    ])
  })

  it('moving TTR is 1 for all-distinct tokens', () => {
    expect(movingTTR(['a', 'b', 'c'], 50)).toBe(1)
  })

  it('tf-idf cosine: identical > overlapping > disjoint', () => {
    const { vectors } = tfidf(['ocean waves blue sea', 'ocean waves blue sea', 'ocean storm night', 'money cars city'])
    const same = sparseCosine(vectors[0], vectors[1])
    const some = sparseCosine(vectors[0], vectors[2])
    const none = sparseCosine(vectors[0], vectors[3])
    expect(same).toBeCloseTo(1)
    expect(some).toBeGreaterThan(none)
    expect(none).toBe(0)
  })
})

describe('sentiment', () => {
  it('scores positive and negative text and handles negation', () => {
    expect(sentiment('I love this beautiful day').comparative).toBeGreaterThan(0)
    expect(sentiment('I hate this lonely pain').comparative).toBeLessThan(0)
    expect(sentiment('I do not love you').score).toBeLessThan(0)
  })

  it('produces one arc point per line', () => {
    expect(sentimentArc('happy\nsad\nhappy').length).toBe(3)
  })
})

describe('projection', () => {
  it('mds keeps similar items closer than dissimilar ones', () => {
    const sim = [
      [1, 0.9, 0.1],
      [0.9, 1, 0.1],
      [0.1, 0.1, 1],
    ]
    const p = mds2d(sim)
    const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1])
    expect(d(p[0], p[1])).toBeLessThan(d(p[0], p[2]))
  })

  it('pca returns 2D points', () => {
    expect(pca2d([[1, 0, 0], [0, 1, 0], [0, 0, 1]]).every((p) => p.length === 2)).toBe(true)
  })
})

describe('lyrics title cleanup', () => {
  it('removes feat/remaster suffixes', () => {
    expect(simplifyTitle('Song (feat. Someone)')).toBe('Song')
    expect(simplifyTitle('Song - 2011 Remaster')).toBe('Song')
  })
})

describe('section markers', () => {
  it('are not counted as words', () => {
    const f = wordFrequencies('[Chorus]\nocean light\n[Verse 2]\nocean')
    expect(f.has('chorus')).toBe(false)
    expect(f.has('verse')).toBe(false)
    expect(textStats('[Chorus]\nocean light').words).toBe(2)
  })
})
