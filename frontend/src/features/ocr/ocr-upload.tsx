import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Upload, CircleNotch, CheckCircle, X, MagnifyingGlassPlus, Copy, Check, FileArrowUp, Sparkle
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { useOcrMutation } from './use-ocr-mutation'
import { toast } from 'sonner'

export function OcrUpload() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isFullPagePreview, setIsFullPagePreview] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const ocrMutation = useOcrMutation()

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleUpload = useCallback((file: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
    ocrMutation.mutate(file)
  }, [previewUrl, ocrMutation])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }, [handleUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleUpload(file)
    }
  }, [handleUpload])

  const handleRemove = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
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

  return (
    <div className="max-w-5xl mx-auto">
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
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileArrowUp className="h-4 w-4 text-accent" size={18} />
                  <h3 className="text-sm font-semibold text-foreground">Source Document</h3>
                </div>
                <button
                  onClick={handleRemove}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label="Remove image"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="relative rounded-xl overflow-hidden bg-black/5 dark:bg-black/40 border border-border/50 aspect-[4/3] flex items-center justify-center group">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain p-2"
                />
                <button
                  onClick={() => setIsFullPagePreview(true)}
                  className="absolute bottom-3 right-3 p-2 rounded-lg bg-background/90 backdrop-blur-md border border-border/60 text-muted-foreground hover:text-foreground transition-colors shadow-md"
                >
                  <MagnifyingGlassPlus size={16} />
                </button>
                {ocrMutation.isPending && (
                  <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                    <div className="scan-line" />
                    <div className="flex items-center gap-2.5 text-xs font-semibold text-accent bg-background/90 px-5 py-2.5 rounded-full border border-accent/30 shadow-lg">
                      <CircleNotch size={16} className="animate-spin" />
                      Analyzing Devanagari Script...
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 sm:p-8 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkle className="h-4 w-4 text-primary" size={18} />
                  <h3 className="text-sm font-semibold text-foreground">Extracted Result</h3>
                </div>
                <AnimatePresence>
                  {ocrMutation.data && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={handleCopy}
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors border border-border/40"
                    >
                      {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
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
                      <p className="text-sm text-muted-foreground font-medium">Processing Devanagari text...</p>
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
                    <div className="flex items-center gap-2 text-xs font-medium text-success">
                      <CheckCircle size={14} />
                      Recognized successfully
                      {ocrMutation.data.engine && (
                        <span className="text-muted-foreground font-normal">
                          via {ocrMutation.data.engine}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 rounded-xl border border-border/60 bg-muted/20 p-4 overflow-auto min-h-[160px]">
                      <p
                        className="text-base leading-relaxed whitespace-pre-wrap font-devanagari text-foreground"
                        lang="ne"
                      >
                        {ocrMutation.data.text || 'No text detected'}
                      </p>
                    </div>
                    {ocrMutation.data.metadata?.daily_remaining !== undefined && (
                      <p className="text-xs text-muted-foreground">
                        Daily requests remaining: <span className="font-semibold text-foreground">{ocrMutation.data.metadata.daily_remaining}</span>
                      </p>
                    )}
                  </motion.div>
                ) : ocrMutation.isError ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex items-center justify-center min-h-[220px]"
                  >
                    <p className="text-sm text-destructive font-medium text-center">
                      {ocrMutation.error?.message || 'OCR processing failed.'}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex items-center justify-center min-h-[220px]"
                  >
                    <p className="text-sm text-muted-foreground text-center max-w-xs leading-relaxed">
                      Extracted Devanagari text will appear here with single-click copy support.
                    </p>
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
            <div className="p-5 rounded-2xl bg-accent/10 border border-accent/20 mb-5 group-hover:scale-110 transition-transform duration-300 shadow-md">
              <Upload className="h-9 w-9 text-accent" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              Upload Document Image
            </h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm leading-relaxed">
              Drag & drop image files here, or click to browse. JPG, PNG, and WebP supported.
            </p>
            <Button
              className="bg-accent text-accent-foreground hover:opacity-90 font-semibold rounded-xl px-7 py-5 shadow-lg hover:shadow-xl transition-all"
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
            <img
              src={previewUrl}
              alt="Full Preview"
              className="w-full h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setIsFullPagePreview(false)}
              className="absolute top-4 right-4 bg-background text-foreground rounded-full p-2 border border-border hover:bg-secondary transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}