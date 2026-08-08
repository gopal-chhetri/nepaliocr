export interface HistoryEntry {
  id: string
  timestamp: number
  text: string
  engine?: string
  image?: string
  confidence?: number | null
  meta?: Record<string, any>
}

const HISTORY_KEY = 'nepali_ocr_history'
const MAX_ENTRIES = 20

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function addHistoryEntry(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): HistoryEntry[] {
  const next: HistoryEntry = { ...entry, id: crypto.randomUUID(), timestamp: Date.now() }
  const history = [next, ...loadHistory()].slice(0, MAX_ENTRIES)
  saveHistory(history)
  return history
}

export function removeHistoryEntry(id: string): HistoryEntry[] {
  const history = loadHistory().filter((e) => e.id !== id)
  saveHistory(history)
  return history
}

export function clearHistory(): HistoryEntry[] {
  localStorage.removeItem(HISTORY_KEY)
  return []
}

function saveHistory(history: HistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch {
    // Quota exceeded (large thumbnails) – prune the oldest entry and retry once.
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_ENTRIES - 5)))
    } catch {
      /* ignore */
    }
  }
}