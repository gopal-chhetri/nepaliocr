import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Upload, CircleNotch, CheckCircle, X, MagnifyingGlassPlus, Copy, Check,
  FileArrowUp, Sparkle, TextT, Download, WarningCircle
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { useOcrMutation } from './use-ocr-mutation'
import { HistoryPanel } from './history-panel'
import { useDailyUsage } from './use-daily-usage'
import { addHistoryEntry, loadHistory, removeHistoryEntry, clearHistory, type HistoryEntry } from './history-store'
import { fileToThumbnail, downloadText, utf8Length } from '@/lib/file-tools'
import { toast } from 'sonner'
import { queryClient } from '@/lib/query-client'
import { DEV_FRIEZE_SHUFFLED } from '@/lib/devanagari'

export function OcrUpload() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isFullPagePreview, setIsFullPagePreview] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory())
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const ocrMutation = useOcrMutation()
  const usageQuery = useDailyUsage()

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const refreshUsage = () => queryClient.invalidateQueries({ queryKey: ['daily-usage'] })

  const handleSelectFile = useCallback((file: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
    setSelectedFile(file)
    ocrMutation.reset()
  }, [previewUrl, ocrMutation])

  const handleConvert = useCallback(async () => {
    if (!selectedFile) return
    const result = await ocrMutation.mutateAsync({ file: selectedFile, purpose: 'ocr' })
    const thumbnail = await fileToThumbnail(selectedFile)
    setHistory(
      addHistoryEntry({
        text: result.text,
        engine: result.engine,
        image: thumbnail,
        confidence: result.confidence,
        meta: result.metadata,
      }),
    )
    refreshUsage()
  }, [selectedFile, ocrMutation])

  const handleReOcr = useCallback((file: File) => {
    handleSelectFile(file)
  }, [handleSelectFile])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleSelectFile(file)
    e.target.value = ''
  }, [handleSelectFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleSelectFile(file)
    }
  }, [handleSelectFile])

  const handleRemove = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setSelectedFile(null)
    ocrMutation.reset()
  }, [previewUrl, ocrMutation])

  const handleCopy = useCallback(async () => {
    if (!ocrMutation.data?.text) return
    try {
      await navigator.clipboard.writeText(ocrMutation.data.text)
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }, [ocrMutation.data])

  const text = ocrMutation.data?.text ?? ''
  const charCount = text ? Array.from(text).length : 0
  const byteCount = text ? utf8Length(text) : 0
  const wordCount = text ? text.trim().split(/\s+/).filter(Boolean).length : 0
  const lineCount = text ? text.split(/\n/).length : 0

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-end mb-4">
        <BadgePill usage={usageQuery.data} />
      </div>

      <div
        className={`rounded-2xl border-2 transition-all duration-300 shadow-xl overflow-hidden ${
          isDragOver
            ? 'border-accent bg-accent/10 dropzone-active scale-[1.01]'
            : previewUrl
              ? 'border-border/80 bg-card/95 backdrop-blur-xl'
              : 'border-dashed border-border/80 bg-card/70 backdrop-blur-md hover:border-accent/60 hover:bg-accent/5'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        {previewUrl ? (
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/60">
            {/* Image pane */}
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileArrowUp className="text-accent" size={18} />
                  <h3 className="text-sm font-semibold text-foreground chalk-text">Source Document</h3>
                </div>
                <button
                  onClick={handleRemove}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label="Remove image"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="relative rounded-xl blackboard-frame bg-black/5 dark:bg-black/40 border border-border/50 aspect-[4/3] flex items-center justify-center group">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain p-2"
                />
                <button
                  onClick={() => setIsFullPagePreview(true)}
                  className="absolute bottom-3 right-3 p-2 rounded-lg bg-background/90 backdrop-blur-md border border-border/60 text-muted-foreground hover:text-foreground transition-colors shadow-md"
                  aria-label="Zoom preview"
                >
                  <MagnifyingGlassPlus size={16} />
                </button>
                {ocrMutation.isPending && (
                  <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                    <div className="scan-line" />
                    <div className="flex items-center gap-2.5 text-xs font-semibold text-accent bg-background/90 px-5 py-2.5 rounded-lg border border-dashed border-accent/30 shadow-lg chalk-text">
                      <CircleNotch size={16} className="animate-spin" />
                      Analyzing Devanagari Script...
                    </div>
                  </div>
                )}
              </div>

              {!ocrMutation.isPending && !ocrMutation.isSuccess && (
                <Button
                  variant="chalk"
                  className="w-full mt-4 rounded-xl py-5 font-semibold shadow-lg"
                  onClick={handleConvert}
                  disabled={ocrMutation.isPending}
                >
                  <Sparkle size={18} className="mr-2" />
                  {ocrMutation.isSuccess ? 'Convert Again' : 'Convert to Nepali Text'}
                </Button>
              )}
            </div>

            {/* Result pane */}
            <div className="p-6 sm:p-8 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkle className="text-accent" size={18} />
                  <h3 className="text-sm font-semibold text-foreground chalk-text">Extracted Result</h3>
                </div>
                <AnimatePresence>
                  {ocrMutation.data && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={handleCopy}
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors border border-border/40"
                      aria-label="Copy result"
                    >
                      {copied ? <Check className="text-success" size={16} /> : <Copy size={16} />}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              <AnimatePresence mode="wait">
                {ocrMutation.isPending ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex items-center justify-center min-h-[220px]"
                  >
                    <div className="text-center space-y-3">
                      <CircleNotch size={36} className="animate-spin text-accent mx-auto" />
                      <p className="text-sm text-muted-foreground font-medium chalk-text">Processing Devanagari text...</p>
                    </div>
                  </motion.div>
                ) : ocrMutation.data ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col gap-4 min-h-[220px]"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-success bg-success/10 border border-success/30 rounded-full px-2.5 py-1">
                        <CheckCircle size={12} /> Recognized
                      </span>
                      {ocrMutation.data.engine && (
                        <span className="inline-flex items-center text-[11px] text-muted-foreground bg-muted/40 border border-border/60 rounded-full px-2.5 py-1">
                          {ocrMutation.data.engine}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 rounded-xl border border-border/60 bg-muted/20 p-4 overflow-auto min-h-[160px] ruled-lines margin-line">
                      <p
                        className="text-base leading-relaxed whitespace-pre-wrap font-devanagari text-foreground"
                        lang="ne"
                      >
                        {text || 'No text detected'}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <StatChip label="Chars" value={charCount.toLocaleString()} />
                      <StatChip label="Words" value={wordCount.toLocaleString()} />
                      <StatChip label="Lines" value={lineCount.toLocaleString()} />
                      <StatChip label="Bytes" value={byteFmt(byteCount)} />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => {
                          if (text) downloadText(`nepali-ocr-${Date.now()}.txt`, text)
                        }}
                      >
                        <Download size={14} className="mr-1.5" /> Download .txt
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-lg"
                        onClick={handleConvert}
                        disabled={!selectedFile || ocrMutation.isPending}
                      >
                        <Sparkle size={14} className="mr-1.5" /> Re-run
                      </Button>
                    </div>
                  </motion.div>
                ) : ocrMutation.isError ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex items-center justify-center min-h-[220px]"
                  >
                    <div className="text-center space-y-2">
                      <WarningCircle size={28} className="text-destructive mx-auto" />
                      <p className="text-sm text-destructive font-medium">{ocrMutation.error?.message || 'OCR processing failed.'}</p>
                      <button onClick={handleRemove} className="text-xs text-muted-foreground underline">Choose another image</button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex items-center justify-center min-h-[220px]"
                  >
                    <div className="text-center space-y-3 max-w-xs">
                      <TextT size={32} className="text-accent/60 mx-auto" />
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Image is ready. Hit{' '}
                        <span className="font-semibold text-accent">Convert to Nepali Text</span>{' '}
                        to extract the Devanagari content.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center py-20 px-8 cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />

            <div className="devanagari-frieze text-xs mb-6 opacity-30">
              {DEV_FRIEZE_SHUFFLED.map((ch, i) => (
                <span key={i}>{ch}</span>
              ))}
            </div>

            <div className="p-5 rounded-2xl bg-accent/10 border border-dashed border-accent/30 mb-5 group-hover:scale-110 transition-transform duration-300">
              <Upload className="h-9 w-9 text-accent" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2 chalk-text">
              Upload Document Image
            </h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm leading-relaxed">
              Drag & drop image files here, or click to browse. JPG and PNG supported.
            </p>
            <Button
              variant="chalk"
              className="font-semibold rounded-xl px-7 py-5 shadow-lg hover:shadow-xl transition-all"
            >
              Choose Image File
            </Button>
          </div>
        )}
      </div>

      {isFullPagePreview && previewUrl && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setIsFullPagePreview(false)}
        >
          <div className="max-w-5xl max-h-[90vh] w-full h-full relative p-6">
            <div className="blackboard-frame w-full h-full rounded-lg overflow-hidden bg-black/40">
              <img
                src={previewUrl}
                alt="Full Preview"
                className="w-full h-full object-contain"
              />
            </div>
            <button
              onClick={() => setIsFullPagePreview(false)}
              className="absolute top-4 right-4 bg-background text-foreground rounded-full p-2 border border-border hover:bg-secondary transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="mt-6">
        <HistoryPanel
          history={history}
          onRemove={(id) => setHistory(removeHistoryEntry(id))}
          onClear={() => setHistory(clearHistory())}
          onReOcr={handleReOcr}
        />
      </div>
    </div>
  )
}

function BadgePill({ usage }: { usage?: { limit: number; used: number; remaining: number } }) {
  const pct = usage ? Math.min(100, Math.round((usage.used / usage.limit) * 100)) : 0
  return (
    <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground bg-card/80 border border-border/70 rounded-full px-3 py-1.5 backdrop-blur">
      <span className={`h-2 w-2 rounded-full ${usage && usage.remaining === 0 ? 'bg-destructive' : pct >= 80 ? 'bg-warning' : 'bg-success'}`} />
      {usage ? (
        <>
          Daily OCR: <span className="font-semibold text-foreground">{usage.remaining}/{usage.limit}</span> left
        </>
      ) : (
        <span>Daily OCR: —</span>
      )}
    </div>
  )
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/30 border border-border/60 rounded-lg px-2.5 py-1">
      <span className="font-semibold text-foreground">{value}</span> {label}
    </span>
  )
}

function byteFmt(n: number) {
  if (n < 1024) return `${n} B`
  return `${(n / 1024).toFixed(1)} KB`
}