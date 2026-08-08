/** Levenshtein edit distance, capped at `max` for speed. */
export function levenshtein(a: string, b: string, max = 100000): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  if (Math.abs(a.length - b.length) > max) return Math.max(a.length, b.length)

  let prev = new Array(b.length + 1)
  let curr = new Array(b.length + 1)
  for (let j = 0; j <= b.length; j++) prev[j] = j

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
    }
    ;[prev, curr] = [curr, prev]
  }
  return prev[b.length]
}

/** 0..1 similarity: 1 = identical. */
export function similarity(
  a: string,
  b: string,
  opts: { trimWhitespace?: boolean; ignorePunctuation?: boolean } = {},
): number {
  let x = a ?? ''
  let y = b ?? ''
  if (opts.trimWhitespace) {
    x = x.replace(/\s+/g, '').trim()
    y = y.replace(/\s+/g, '').trim()
  }
  if (opts.ignorePunctuation) {
    x = x.replace(/[\u0964\u0965.,!?;:'"]/g, '')
    y = y.replace(/[\u0964\u0965.,!?;:'"]/g, '')
  }
  const maxLen = Math.max(x.length, y.length)
  if (maxLen === 0) return 1
  return 1 - levenshtein(x, y) / maxLen
}