# Lyric Lens

Analyze song lyrics by artist, album or song, paste your own, and compare songs by meaning.

**Live app:** https://yara-youssef.github.io/music-analyzer/

## Features

- **Explore**: search the music catalog for an artist, album or song.
  - **Song**: word cloud (tinted by sentiment), most used words, positive vs negative words,
    emotional arc line by line, and a repetition map (word × word self-similarity: choruses show up as stripes).
  - **Album / artist** (top 10–25 songs): combined word cloud, recurring themes (share of songs a word
    appears in), mood, vocabulary richness and repetitiveness per song, and each song's most distinctive words.
- **Paste lyrics**: analyze any text, and add it to the comparison.
- **Compare**: pick any songs (from search or pasted), and drag them into the order you want:
  - **Side by side**: the Explore song analysis for every selected song in aligned columns (key numbers,
    word cloud, top words, emotional words, emotional arc on a shared scale, repetition map).
  - **How similar are they?**, by one of two methods:
    - **Shared vocabulary** (default): TF-IDF cosine similarity.
    - **Meaning (AI)**: a sentence-embedding model (`all-MiniLM-L6-v2` via Transformers.js) runs in the
      browser, so songs about the same thing score close even with different wording. The model (~23 MB) is
      downloaded only when you choose this option.
  - Similarity matrix, 2D song map, closest / furthest pairs, and a pair breakdown of shared and unique words.

Everything runs client-side; no API keys are needed.

## Data sources

- Catalog: [iTunes Search API](https://performance-partners.apple.com/search-api), falling back to the
  [Deezer API](https://developers.deezer.com/api) when iTunes is unreachable
- Lyrics: [LRCLIB](https://lrclib.net), falling back to [lyrics.ovh](https://lyricsovh.docs.apiary.io). Songs
  without found lyrics can be pasted manually from the song page.
- Sentiment: [AFINN-165](https://github.com/words/afinn-165) word list, with simple negation handling.

## Development

```sh
npm install
npm run dev     # start the dev server
npm test        # unit tests for the text analysis
npm run build   # production build
```

## Deployment

Every push to `main` is built, tested and published to GitHub Pages by
`.github/workflows/deploy.yml`.
