import dic from '@/data/dictionary'

const SENTENCES: string[] = dic

/** Pick a random contiguous block of `lines` sentences from the poem dictionary. */
export function randomLines(lines: number = 1): string[] {
  if (SENTENCES.length === 0) return []
  const n = Math.min(Math.max(lines, 1), 20)
  if (n === 1) return [SENTENCES[Math.floor(Math.random() * SENTENCES.length)]]
  const start = Math.floor(Math.random() * (SENTENCES.length - n))
  return SENTENCES.slice(start, start + n)
}

/** Single-paragraph convenience wrapper (legacy callers). */
export function randomSnippet(lines: number = 1): string {
  return randomLines(lines).join(' ')
}