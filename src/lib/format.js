export const pct = (v) => `${Math.round(v * 100)}%`
export const signed = (v, d = 2) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(d)}`
export const num = (v) => Math.round(v).toLocaleString()

export function moodLabel(comparative) {
  if (comparative > 0.06) return 'Positive'
  if (comparative > 0.02) return 'Leaning positive'
  if (comparative < -0.06) return 'Negative'
  if (comparative < -0.02) return 'Leaning negative'
  return 'Neutral / mixed'
}
