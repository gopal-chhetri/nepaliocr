import { useState, useRef, useCallback, useMemo } from 'react'
import { Keyboard } from '@phosphor-icons/react'
import { nepalify, type NepaliLayout } from '@/lib/nepalify'
import { utf8Length } from '@/lib/file-tools'
import { DEV_ALPHABET } from '@/lib/devanagari'

const VOWELS = ['अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ए', 'ऐ', 'ओ', 'औ']
const MATRAS = ['ा', 'ि', 'ी', 'ु', 'ू', 'े', 'ै', 'ो', 'ौ', 'ृ', 'ं', 'ँ', 'ः']
const NUMBERS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']
const EXTRA = ['।', '॥', 'ॐ', '्', 'श्र', 'ऋ']

interface DevanagariEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}

export function DevanagariEditor({ value, onChange, placeholder, rows = 6 }: DevanagariEditorProps) {
  const [layout, setLayout] = useState<NepaliLayout>('romanized')
  const taRef = useRef<HTMLTextAreaElement | null>(null)

  const insertChar = useCallback(
    (ch: string) => {
      const ta = taRef.current
      if (!ta) {
        onChange(value + ch)
        return
      }
      const start = ta.selectionStart ?? value.length
      const end = ta.selectionEnd ?? value.length
      const next = value.slice(0, start) + ch + value.slice(end)
      onChange(next)
      requestAnimationFrame(() => {
        ta.focus()
        ta.setSelectionRange(start + ch.length, start + ch.length)
      })
    },
    [value, onChange],
  )

  const stats = useMemo(() => {
    const chars = Array.from(value).length
    const words = value.trim() ? value.trim().split(/\s+/).filter(Boolean).length : 0
    const bytes = utf8Length(value)
    return { chars, words, bytes }
  }, [value])

  return (
    <div className="space-y-4">
      {/* Toolbar: layout toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Keyboard className="text-accent" size={18} />
          <span className="text-sm font-semibold text-foreground chalk-text">Type your annotation</span>
        </div>
        <div className="inline-flex rounded-lg border border-border/60 p-0.5">
          {(['romanized', 'traditional'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLayout(l)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-colors ${
                layout === l ? 'bg-accent/15 text-accent' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => onChange(nepalify(e.target.value, layout))}
        placeholder={placeholder}
        rows={rows}
        lang="ne"
        className="w-full rounded-xl border border-border/60 bg-muted/20 p-4 text-lg leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent/40 font-devanagari placeholder:font-sans placeholder:text-sm"
      />

      <div className="flex flex-wrap gap-2">
        <Stat label="Chars" value={stats.chars} />
        <Stat label="Words" value={stats.words} />
        <Stat label="Bytes" value={stats.bytes < 1024 ? `${stats.bytes} B` : `${(stats.bytes / 1024).toFixed(1)} KB`} />
      </div>

      <div className="grid grid-cols-1 gap-3">
        <KeyboardGroup label="Consonants" chars={DEV_ALPHABET} onInsert={insertChar} />
        <KeyboardGroup label="Vowels" chars={VOWELS} onInsert={insertChar} />
        <KeyboardGroup label="Vowel signs" chars={MATRAS} onInsert={insertChar} />
        <KeyboardGroup label="Numbers" chars={NUMBERS} onInsert={insertChar} />
        <KeyboardGroup label="Extra" chars={EXTRA} onInsert={insertChar} />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/30 border border-border/60 rounded-lg px-2.5 py-1">
      <span className="font-semibold text-foreground">{value}</span> {label}
    </span>
  )
}

function KeyboardGroup({ label, chars, onInsert }: { label: string; chars: string[]; onInsert: (c: string) => void }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/5 p-3">
      <p className="text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide">{label}</p>
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
        {chars.map((ch) => (
          <button
            key={ch}
            onClick={() => onInsert(ch)}
            className="h-10 rounded-lg border border-border/60 bg-muted/20 hover:bg-accent/15 hover:border-accent/40 text-lg font-devanagari text-foreground transition-colors"
            lang="ne"
          >
            {ch}
          </button>
        ))}
      </div>
    </div>
  )
}