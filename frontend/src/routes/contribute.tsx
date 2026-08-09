import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  DotsThree, CircleNotch, Crosshair, TextAlignLeft, Eyedropper, FloppyDiskBack,
  SkipForward, Images, Upload, CheckCircle, WarningCircle, Camera, ArrowClockwise
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { useOcrMutation } from '@/features/ocr/use-ocr-mutation'
import { DevanagariEditor } from '@/features/typing/devanagari-editor'
import { randomLines } from '@/lib/generator'
import { similarity } from '@/lib/lev'
import {
  createContribution, getContribution, getNextAnnotation, submitAnnotation,
  type Contribution, type NextAnnotationResponse
} from '@/lib/annotate-api'
import { presignUpload, uploadToPresigned } from '@/lib/storage-api'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'

const clampLines = (n: number) => Math.min(Math.max(n || 1, 1), 20)

export function ContributePage() {
  const [activeTab, setActiveTab] = useState<'collect' | 'annotate'>('collect')
  return (
    <div className="min-h-screen bg-background">
      <div className="pt-24 pb-16 container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="text-center space-y-4 mb-10">
          <h2 className="text-4xl sm:text-5xl font-serif-display font-bold text-foreground chalk-text">
            Contribute
          </h2>
          <span className="chalk-underline block mx-auto w-20 h-1 mt-2 mb-4" />
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Generate Nepali sentences, capture them as images (handwriting or AI-rendered), and
            annotate the extracted lines to build ground-truth training data.
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-xl border border-border bg-card/80 p-1">
            <TabButton active={activeTab === 'collect'} onClick={() => setActiveTab('collect')}>
              <DotsThree size={15} /> Data Collection
            </TabButton>
            <TabButton active={activeTab === 'annotate'} onClick={() => setActiveTab('annotate')}>
              <Images size={15} /> Annotation
            </TabButton>
          </div>
        </div>

        {activeTab === 'collect' ? (
          <DataCollection />
        ) : (
          <Annotation />
        )}
      </div>
    </div>
  )
}

/* ------------------------------ Data Collection ------------------------------ */

type SourceMode = 'handwritten' | 'ai'

function DataCollection() {
  const [lines, setLines] = useState(1)
  const [snippetLines, setSnippetLines] = useState<string[]>([])
  const [sourceMode, setSourceMode] = useState<SourceMode>('handwritten')
  const [submitPending, setSubmitPending] = useState(false)

  // AI-rendered flow
  const [aiImageKey, setAiImageKey] = useState<string | null>(null)
  const [genImage, setGenImage] = useState<string | null>(null)
  const [matchScore, setMatchScore] = useState<number | null>(null)
  const [ocrText, setOcrText] = useState('')
  const [aiRendering, setAiRendering] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const ocrMutation = useOcrMutation()

  // handwritten upload flow
  const [fileInfo, setFileInfo] = useState<{ file: File; preview: string } | null>(null)
  const [handwrittenKey, setHandwrittenKey] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  // running contribution
  const [contribution, setContribution] = useState<Contribution | null>(null)

  const snippet = useMemo(() => snippetLines.join('\n'), [snippetLines])

  const clearSourceState = useCallback(() => {
    setAiImageKey(null)
    setGenImage(null)
    setMatchScore(null)
    setOcrText('')
    setAiRendering(false)
    setAiError(null)
    setFileInfo(null)
    setHandwrittenKey(null)
    setContribution(null)
    ocrMutation.reset()
  }, [ocrMutation])

  const handleGenerate = useCallback(() => {
    if (genImage) URL.revokeObjectURL(genImage)
    setSnippetLines(randomLines(clampLines(lines)))
    clearSourceState()
  }, [lines, genImage, clearSourceState])

  const renderAndOcr = async () => {
    if (!snippetLines.length) return
    setAiRendering(true)
    setAiError(null)
    ocrMutation.reset()
    try {
      const blob = await renderDev(snippet)
      const file = new File([blob], 'nepali-sample.png', { type: 'image/png' })
      if (genImage) URL.revokeObjectURL(genImage)
      setGenImage(URL.createObjectURL(blob))
      const result = await ocrMutation.mutateAsync({ file, purpose: 'sample' })
      const key = result.metadata?.image_key as string | undefined
      if (key) setAiImageKey(key)
      setOcrText(result.text || '')
      setMatchScore(
        Math.round(similarity(snippet.replace(/\s+/g, ''), (result.text || '').replace(/\s+/g, '')) * 100),
      )
    } catch (e: any) {
      setAiError(e.message || 'Render & OCR test failed')
      toast.error(e.message || 'Render & OCR test failed')
    } finally {
      setAiRendering(false)
    }
  }

  const handleFileChange = async (file: File | undefined) => {
    setContribution(null)
    setHandwrittenKey(null)
    if (file) {
      setFileInfo({ file, preview: URL.createObjectURL(file) })
      setUploading(true)
      try {
        const presign = await presignUpload({
          filename: file.name,
          content_type: file.type || 'image/png',
          size: file.size,
          section: 'uploads',
        })
        const res = await uploadToPresigned(presign.url, file)
        if (!res.ok) throw new Error(`Upload failed (${res.status})`)
        setHandwrittenKey(presign.key)
        toast.success('Image uploaded')
      } catch (e: any) {
        toast.error(e.message || 'Upload failed')
      } finally {
        setUploading(false)
      }
    } else {
      setFileInfo(null)
    }
  }

  const handleSubmit = async () => {
    if (!snippetLines.length) {
      toast.error('Generate lines first')
      return
    }
    const imageKey = sourceMode === 'ai' ? aiImageKey : handwrittenKey
    if (!imageKey) {
      toast.error(sourceMode === 'ai' ? 'Run Render & OCR Test first' : 'Upload your handwritten photo first')
      return
    }

    setSubmitPending(true)
    setContribution(null)
    try {
      const created = await createContribution({
        image_key: imageKey,
        source: sourceMode,
        expected_lines: snippetLines,
      })
      const done = await waitForSegmentation(created.id)
      setContribution(done)
      if (done?.status === 'segmented') toast.success('Lines extracted & saved')
      else if (done?.status === 'error') toast.error(done.error || 'Extraction failed')
      else toast.warning('Still processing — refresh to see progress')
    } catch (e: any) {
      toast.error(e.message || 'Failed to save contribution')
    } finally {
      setSubmitPending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Generate card */}
      <div className="rounded-2xl border border-border/70 bg-card/80 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <DotsThree className="text-accent" size={18} />
            <h3 className="text-sm font-semibold text-foreground chalk-text">Generate Nepali Sentence</h3>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Lines
              <input
                type="number"
                min={1}
                max={20}
                value={lines}
                onChange={(e) => setLines(Number(e.target.value))}
                className="w-16 h-9 rounded-lg border border-border/60 bg-muted/20 text-center text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </label>
            <Button variant="chalk" size="sm" className="rounded-lg" onClick={handleGenerate}>
              <Eyedropper size={14} className="mr-1.5" /> Generate
            </Button>
          </div>
        </div>
        <div className="p-5">
          {snippetLines.length ? (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-1.5">
              {snippetLines.map((line, i) => (
                <p key={i} className="text-lg font-devanagari leading-relaxed text-foreground" lang="ne">
                  {line}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Click <span className="font-semibold text-accent">Generate</span> to draw random line(s) from the Nepali poem dictionary.
            </p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Each line is shown separately — write exactly these lines on paper (or use the AI-rendered version) for the collection.
          </p>
        </div>
      </div>

      {/* Source card */}
      <div className="rounded-2xl border border-border/70 bg-card/80 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Camera className="text-accent" size={18} />
            <h3 className="text-sm font-semibold text-foreground chalk-text">Image source</h3>
          </div>
          <div className="inline-flex rounded-lg border border-border bg-muted/20 p-0.5">
            <SourceTab active={sourceMode === 'handwritten'} onClick={() => setSourceMode('handwritten')}>
              Hand-written
            </SourceTab>
            <SourceTab active={sourceMode === 'ai'} onClick={() => setSourceMode('ai')}>
              AI-rendered
            </SourceTab>
          </div>
          <Button
            variant="chalk"
            size="sm"
            className="rounded-lg"
            onClick={handleSubmit}
            disabled={submitPending || uploading || (sourceMode === 'ai' ? !aiImageKey : !handwrittenKey)}
          >
            {submitPending ? (
              <CircleNotch size={14} className="mr-1.5 animate-spin" />
            ) : (
              <FloppyDiskBack size={14} className="mr-1.5" />
            )}
            Extract & Save
          </Button>
        </div>
        <div className="p-5">
          {sourceMode === 'handwritten' ? (
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/60 bg-muted/10 p-8 text-center cursor-pointer hover:border-accent/50 transition-colors min-h-56">
                <Camera size={32} className="text-accent/70" />
                <span className="text-sm text-muted-foreground">
                  {fileInfo
                    ? 'Uploaded — you can replace the photo'
                    : 'Snap a photo of your handwritten lines or choose an image'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0])}
                />
              </label>
              {fileInfo && (
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                  <img
                    src={fileInfo.preview}
                    alt="Handwritten upload"
                    className="max-w-full h-40 object-contain mx-auto bg-white dark:bg-black rounded-lg"
                  />
                  <p className="mt-2 text-xs text-muted-foreground text-center">
                    {uploading ? (
                      <><CircleNotch size={12} className="inline animate-spin mr-1" />Uploading…</>
                    ) : handwrittenKey ? (
                      'Uploaded to MinIO ✓'
                    ) : (
                      'Not uploaded yet'
                    )}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {!genImage && !aiRendering && (
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/60 bg-muted/10 p-8 text-center min-h-56">
                  <Crosshair size={32} className="text-accent/70" />
                  <span className="text-sm text-muted-foreground max-w-md leading-relaxed">
                    Render the generated Nepali lines above as an image and run an OCR sanity check before saving.
                  </span>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button
                      variant="chalk"
                      size="sm"
                      className="rounded-lg"
                      onClick={renderAndOcr}
                      disabled={!snippetLines.length || ocrMutation.isPending || aiRendering}
                    >
                      <Crosshair size={14} className="mr-1.5" /> Render & OCR Test
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg text-muted-foreground"
                      onClick={handleGenerate}
                    >
                      <ArrowClockwise size={14} className="mr-1.5" /> Reset
                    </Button>
                  </div>
                </div>
              )}

              {aiRendering && (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <CircleNotch size={28} className="animate-spin text-accent" />
                  <p className="text-sm text-muted-foreground chalk-text">Processing Nepali text to image…</p>
                </div>
              )}

              {genImage && !aiRendering && (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="chalk"
                      size="sm"
                      className="rounded-lg"
                      onClick={renderAndOcr}
                      disabled={!snippetLines.length || ocrMutation.isPending || aiRendering}
                    >
                      {aiRendering ? (
                        <CircleNotch size={14} className="mr-1.5 animate-spin" />
                      ) : ocrMutation.isPending ? (
                        <CircleNotch size={14} className="mr-1.5 animate-spin" />
                      ) : (
                        <Crosshair size={14} className="mr-1.5" />
                      )}
                      {aiRendering ? 'Rendering…' : ocrMutation.isPending ? 'Analyzing…' : 'Render & OCR Test'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg text-muted-foreground"
                      onClick={handleGenerate}
                    >
                      <ArrowClockwise size={14} className="mr-1.5" /> Reset
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Rendered image</p>
                    <img
                      src={genImage}
                      alt="Rendered"
                      className="max-w-full h-32 object-contain mx-auto rounded-xl border border-border/60 bg-white dark:bg-black p-2"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">OCR result</p>
                    {ocrMutation.isPending ? (
                      <div className="rounded-xl border border-border/60 bg-muted/20 p-3 min-h-[90px] flex flex-col items-center justify-center gap-2">
                        <CircleNotch size={20} className="animate-spin text-accent" />
                        <p className="text-xs text-muted-foreground">Analyzing Devanagari text…</p>
                      </div>
                    ) : aiError ? (
                      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 min-h-[90px] flex flex-col items-center justify-center gap-2 text-center">
                        <WarningCircle size={20} className="text-destructive" />
                        <p className="text-xs text-destructive">{aiError}</p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-success/40 bg-success/5 p-3 min-h-[90px]">
                        {ocrText ? (
                          <div className="space-y-1.5">
                            {ocrText.split('\n').map((line, i) => (
                              <p key={i} className="text-base font-devanagari leading-relaxed text-foreground" lang="ne">
                                {line}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No text detected</p>
                        )}
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Engine: <span className="font-semibold text-foreground">{ocrMutation.data?.engine || '-'}</span>
                      </p>
                      <MatchBadge score={matchScore} />
                    </div>
                  </div>
                </div>
                </>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              variant="chalk"
              size="sm"
              className="rounded-lg"
              onClick={handleSubmit}
              disabled={submitPending || uploading || (sourceMode === 'ai' ? !aiImageKey : !handwrittenKey)}
            >
              {submitPending ? (
                <CircleNotch size={14} className="mr-1.5 animate-spin" />
              ) : (
                <FloppyDiskBack size={14} className="mr-1.5" />
              )}
              Extract & Save for training
            </Button>
            <p className="text-xs text-muted-foreground">
              Extracted line images are saved to MinIO and queued for annotation in the background.
            </p>
          </div>
        </div>
      </div>

      {/* Background result card */}
      <AnimatePresence>
        {contribution && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-border/70 bg-card/80 backdrop-blur-xl shadow-xl overflow-hidden"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <TextAlignLeft className="text-accent" size={18} />
                <h3 className="text-sm font-semibold text-foreground chalk-text">Extracted lines</h3>
              </div>
              <ContributionStatusBadge contribution={contribution} />
            </div>
            <div className="p-5">
              {contribution.status === 'processing' || contribution.status === 'pending' ? (
                <div className="flex flex-col items-center py-10 gap-3">
                  <CircleNotch size={28} className="animate-spin text-accent" />
                  <p className="text-sm text-muted-foreground">Extracting lines in the background…</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    onClick={async () => setContribution(await getContribution(contribution.id))}
                  >
                    Refresh
                  </Button>
                </div>
              ) : contribution.status === 'error' ? (
                <div className="flex flex-col items-center py-10 gap-3 text-center">
                  <WarningCircle size={36} className="text-destructive/70" />
                  <p className="text-sm text-destructive font-medium max-w-md">{contribution.error || 'Processing failed'}</p>
                </div>
              ) : (
                <>
                  {contribution.lines_requested !== contribution.lines_found && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/5 px-3 py-2 text-xs text-warning">
                      <WarningCircle size={14} />
                      Found {contribution.lines_found ?? 0} lines but generated {contribution.lines_requested}. Extras are flagged as “extra”.
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-3">
                    {contribution.segments.map((seg) => (
                      <div
                        key={seg.id}
                        className={`rounded-xl border border-border/60 bg-muted/20 p-3 ${seg.is_extra ? 'opacity-80' : ''}`}
                      >
                        <img
                          src={seg.image_url}
                          alt={`Line ${seg.index + 1}`}
                          className="w-full h-16 object-contain bg-white dark:bg-black rounded-lg"
                        />
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-muted-foreground uppercase">Line {seg.index + 1}</span>
                          {seg.is_extra ? (
                            <span className="text-[10px] font-bold text-warning bg-warning/10 border border-warning/30 rounded-full px-2 py-0.5 uppercase">extra</span>
                          ) : seg.expected_text ? (
                            <span className="text-[11px] font-devanagari text-muted-foreground truncate" lang="ne">{seg.expected_text}</span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

async function waitForSegmentation(id: string): Promise<Contribution | null> {
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000))
    const c = await getContribution(id)
    if (c.status === 'segmented' || c.status === 'error') return c
  }
  return null
}

/* ------------------------------ Annotation ------------------------------ */

function Annotation() {
  const [current, setCurrent] = useState<NextAnnotationResponse | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'none' | 'done' | 'error'>('loading')
  const [error, setError] = useState('')
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [skipExcluded, setSkipExcluded] = useState<string[]>([])

  const loadNext = useCallback(async (excluded: string[] = []) => {
    setState('loading')
    setText('')
    try {
      const next = await getNextAnnotation(excluded)
      setCurrent(next)
      if (next.available && next.next) setState('ready')
      else setState(next.reason === 'done' ? 'done' : 'none')
    } catch (e: any) {
      setCurrent(null)
      setError(e.message || 'Failed to load segment')
      setState('error')
    }
  }, [])

  const handleSubmit = async () => {
    if (!current?.next || !text.trim()) {
      toast.error('Please type your annotation first')
      return
    }
    setSubmitting(true)
    try {
      await submitAnnotation(current.next.segment_id, text.trim())
      toast.success('Annotation submitted')
      await loadNext()
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit annotation')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSkip = () => {
    if (!current?.next) return
    const id = current.next.segment_id
    const ids = skipExcluded.includes(id) ? skipExcluded : [...skipExcluded, id]
    setSkipExcluded(ids)
    loadNext(ids)
  }

  useEffect(() => {
    loadNext()
  }, [loadNext])

  return (
    <div className="rounded-2xl border border-border/70 bg-card/80 backdrop-blur-xl shadow-xl overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Images className="text-accent" size={18} />
          <h3 className="text-sm font-semibold text-foreground chalk-text">Annotate a line image</h3>
        </div>
        {current && (
          <span className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{current.remaining}</span> left · {current.done} of {current.total} done
          </span>
        )}
        <Button
          variant="chalk"
          size="sm"
          className="rounded-lg"
          onClick={handleSubmit}
          disabled={submitting || state !== 'ready' || !text.trim()}
        >
          {submitting ? (
            <CircleNotch size={14} className="mr-1.5 animate-spin" />
          ) : (
            <Upload size={14} className="mr-1.5" />
          )}
          Submit
        </Button>
      </div>

      <div className="p-5">
        {state === 'loading' && (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <CircleNotch size={22} className="animate-spin text-accent/70" />
            <p className="text-sm text-muted-foreground">Checking for available images…</p>
          </div>
        )}

        {state === 'none' && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Images size={40} className="text-accent/50" />
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              No images available at the moment. Head over to the{' '}
              <span className="font-semibold text-accent">Data Collection</span> tab and save a
              contribution first.
            </p>
            <Button variant="outline" size="sm" className="rounded-lg mt-2" onClick={() => loadNext()}>
              <ArrowClockwise size={14} className="mr-1.5" /> Check again
            </Button>
          </div>
        )}

        {state === 'done' && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <CheckCircle size={40} className="text-success/70" />
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              All images are annotated — nothing left to do. Nice work!
            </p>
            <Button variant="outline" size="sm" className="rounded-lg mt-2" onClick={() => loadNext()}>
              <ArrowClockwise size={14} className="mr-1.5" /> Check again
            </Button>
          </div>
        )}

        {state === 'error' && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <WarningCircle size={40} className="text-destructive/70" />
            <p className="text-sm text-destructive font-medium">{error}</p>
            <Button variant="outline" size="sm" className="rounded-lg mt-2" onClick={() => loadNext()}>
              Retry
            </Button>
          </div>
        )}

        {state === 'ready' && current?.next && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Line image ({current.next.index + 1})
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg text-muted-foreground"
                onClick={handleSkip}
              >
                <SkipForward size={14} className="mr-1.5" /> Skip
              </Button>
            </div>
            <div className="rounded-xl border border-border/60 blackboard-frame bg-black/5 dark:bg-black/40 p-3 flex items-center justify-center">
              <img
                src={current.next.image_url}
                alt="Line to annotate"
                className="max-w-full max-h-64 object-contain"
              />
            </div>

            <DevanagariEditor
              value={text}
              onChange={setText}
              placeholder="Type what you read in the image (roman → Devanagari)"
              rows={6}
            />
            <Button
              variant="chalk"
              className="w-full rounded-xl py-5 font-semibold shadow-lg"
              onClick={handleSubmit}
              disabled={submitting || !text.trim()}
            >
              {submitting ? (
                <CircleNotch size={18} className="mr-2 animate-spin" />
              ) : (
                <Upload size={18} className="mr-2" />
              )}
              Submit Annotation
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------ helpers ------------------------------ */

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-accent text-accent-foreground shadow' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}

function SourceTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
        active ? 'bg-accent text-accent-foreground shadow' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}

function MatchBadge({ score }: { score: number | null }) {
  if (score === null) return null
  const config =
    score >= 90
      ? { cls: 'bg-success/10 text-success border-success/30', label: 'Excellent' }
      : score >= 60
        ? { cls: 'bg-warning/10 text-warning border-warning/30', label: 'Partial' }
        : { cls: 'bg-destructive/10 text-destructive border-destructive/30', label: 'Poor' }
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-1 border ${config.cls}`}>
      Match {score}% · {config.label}
    </span>
  )
}

function ContributionStatusBadge({ contribution }: { contribution: Contribution }) {
  if (contribution.status === 'segmented')
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-1 border bg-success/10 text-success border-success/30">
        <CheckCircle size={12} /> {contribution.lines_found ?? 0} lines
      </span>
    )
  if (contribution.status === 'error')
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-1 border bg-destructive/10 text-destructive border-destructive/30">
        <WarningCircle size={12} /> error
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-1 border bg-warning/10 text-warning border-warning/30">
      <CircleNotch size={12} className="animate-spin" /> processing
    </span>
  )
}

/** Render Devanagari text to a PNG blob on a canvas (client-side image for the AI / OCR flow). */
async function renderDev(text: string): Promise<Blob> {
  const lines = text.split('\n')
  const lineH = 44
  const fontSize = 28
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  ctx.font = `${fontSize}px serif`
  const width = Math.min(1200, Math.max(400, Math.ceil(ctx.measureText(text).width) + 40))
  canvas.width = width * 2
  canvas.height = (lines.length * lineH + 32) * 2
  ctx.scale(2, 2)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, lines.length * lineH + 32)
  ctx.fillStyle = '#111111'
  ctx.textBaseline = 'top'
  ctx.font = `${fontSize}px 'Noto Sans Devanagari', 'Mangal', serif`
  lines.forEach((line, i) => {
    ctx.fillText(line, 20, 16 + i * lineH)
  })
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas render failed'))), 'image/png')
  })
}