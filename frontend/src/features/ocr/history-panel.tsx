import { useState } from 'react'
import {
  Clock, Trash, Copy, Check, Download, ArrowCounterClockwise, CaretDown, TrashSimple
} from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { dataUrlToFile, downloadText } from '@/lib/file-tools'
import type { HistoryEntry } from './history-store'

interface HistoryPanelProps {
  history: HistoryEntry[]
  onRemove: (id: string) => void
  onClear: () => void
  onReOcr: (file: File) => void
}

export function HistoryPanel({ history, onRemove, onClear, onReOcr }: HistoryPanelProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = async (entry: HistoryEntry) => {
    try {
      await navigator.clipboard.writeText(entry.text)
      setCopiedId(entry.id)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopiedId(null), 1500)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const handleReOcr = (entry: HistoryEntry) => {
    if (!entry.image) return
    const file = dataUrlToFile(entry.image, `reocr-${entry.timestamp}.jpg`)
    onReOcr(file)
    toast.success('Re-running OCR on stored image')
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-card/80 backdrop-blur-xl shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-accent" size={18} />
          <h3 className="text-sm font-semibold text-foreground chalk-text">Local OCR History</h3>
          <span className="text-xs text-muted-foreground">({history.length})</span>
        </div>
        {history.length > 0 && (
          <button
            onClick={() => {
              onClear()
              toast.success('History cleared')
            }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            <TrashSimple size={13} /> Clear
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted-foreground text-center">
          No OCR runs yet. Convert an image and it will be saved here (browser-local only).
        </p>
      ) : (
        <ul className="max-h-[360px] overflow-y-auto">
          <AnimatePresence initial={false}>
            {history.map((entry) => (
              <motion.li
                key={entry.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="border-b border-border/40 last:border-0"
              >
                <button
                  onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                  className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-secondary/40 transition-colors"
                >
                  {entry.image ? (
                    <img
                      src={entry.image}
                      alt="OCR source"
                      className="h-12 w-12 rounded-lg object-cover border border-border/60 flex-shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-accent/10 border border-border/60 flex items-center justify-center flex-shrink-0">
                      <Clock className="text-accent/60" size={20} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                    <p className="text-sm truncate font-devanagari text-foreground/90">
                      {entry.text || 'No text detected'}
                    </p>
                  </div>
                  <CaretDown
                    className={`flex-shrink-0 text-muted-foreground transition-transform ${expanded === entry.id ? 'rotate-180' : ''}`}
                    size={16}
                  />
                </button>

                <AnimatePresence>
                  {expanded === entry.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4">
                        <div className="rounded-xl border border-border/60 bg-muted/20 p-3 mb-3">
                          <p
                            className="text-sm leading-relaxed whitespace-pre-wrap font-devanagari text-foreground"
                            lang="ne"
                          >
                            {entry.text || 'No text detected'}
                          </p>
                          {entry.engine && (
                            <p className="text-[11px] text-muted-foreground mt-2">via {entry.engine}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <IconAction onClick={() => handleCopy(entry)} label="Copy">
                            {copiedId === entry.id ? (
                              <Check className="text-success" size={13} />
                            ) : (
                              <Copy size={13} />
                            )}
                          </IconAction>
                          <IconAction
                            onClick={() => downloadText(`nepali-ocr-${entry.timestamp}.txt`, entry.text)}
                            label="Download .txt"
                          >
                            <Download size={13} />
                          </IconAction>
                          <IconAction onClick={() => handleReOcr(entry)} label="Re-run OCR">
                            <ArrowCounterClockwise size={13} />
                          </IconAction>
                          <IconAction
                            onClick={() => onRemove(entry.id)}
                            label="Delete"
                            danger
                          >
                            <Trash size={13} />
                          </IconAction>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  )
}

function IconAction({
  children,
  onClick,
  label,
  danger,
}: {
  children: React.ReactNode
  onClick: () => void
  label: string
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
        danger
          ? 'text-destructive border-destructive/30 hover:bg-destructive/10'
          : 'text-muted-foreground border-border/60 hover:text-foreground hover:bg-secondary'
      }`}
    >
      {children} {label}
    </button>
  )
}