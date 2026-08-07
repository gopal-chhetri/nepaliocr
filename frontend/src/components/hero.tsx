import { ArrowRight, Sparkle, FileText, CheckCircle, ShieldCheck } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Link } from '@tanstack/react-router'
import { DEV_GRID, DEV_FRIEZE_SHUFFLED } from '@/lib/devanagari'

export function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-background py-16 sm:py-24 lg:py-32 border-b border-border/40"
    >
      {/* Chalk dust glow spots */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-accent/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-primary/8 rounded-full blur-[160px] pointer-events-none" />

      {/* Devanagari alphabet frieze top */}
      <div className="devanagari-frieze text-xs sm:text-sm py-2 sm:py-3 border-b border-border/20">
        {DEV_FRIEZE_SHUFFLED.map((ch, i) => (
          <span key={i} className="hover:opacity-60 transition-opacity cursor-default">{ch}</span>
        ))}
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 mt-4">
          <motion.div
            className="flex-1 space-y-6 sm:space-y-8 text-center lg:text-left"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {/* Chalk badge */}
            <div className="inline-flex items-center gap-2 rounded-lg border border-dashed border-accent/50 bg-accent/8 px-4 py-1.5 text-xs font-semibold text-accent shadow-sm">
              <Sparkle className="h-3.5 w-3.5" size={14} />
              <span className="chalk-text">OCR for Nepali & Devanagari text</span>
            </div>

            {/* Chalk heading with wavy underline */}
            <h1 className="font-serif-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] text-foreground chalk-text">
              Digitize Nepali <br />
              <span className="chalk-heading text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-accent">
                Documents & Script
              </span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-[580px] leading-relaxed mx-auto lg:mx-0">
              Turn scans, printed books, and Devanagari manuscripts into editable digital text.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link to="/upload" className="w-full sm:w-auto">
                <Button
                  variant="chalk"
                  size="lg"
                  className="w-full sm:w-auto font-semibold px-8 py-6 rounded-xl shadow-lg transition-all duration-300"
                >
                  Start Extractor Free
                  <ArrowRight className="ml-2 h-4 w-4" size={16} />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="chalk-outline"
                className="w-full sm:w-auto font-medium px-8 py-6 rounded-xl"
                onClick={() => {
                  const el = document.getElementById('features')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                How It Works
              </Button>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-muted-foreground font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-success" size={16} />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-accent" size={16} />
                <span>Private & Ephemeral</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="flex-1 w-full max-w-lg lg:max-w-none relative"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          >
            <div className="relative aspect-[4/3] rounded-2xl blackboard-frame bg-card/80 backdrop-blur-xl overflow-hidden shadow-2xl group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

              <div className="flex flex-col items-center justify-center h-full p-8 relative z-10">
                {/* Devanagari chalk grid */}
                <div className="chalk-grid w-full max-w-[200px] mb-6">
                  {DEV_GRID.map((ch, i) => (
                    <span key={i}>{ch}</span>
                  ))}
                </div>

                <div className="space-y-2.5 w-full max-w-xs text-center">
                  <div className="h-3 bg-primary/20 rounded-full w-full animate-pulse" />
                  <div className="h-3 bg-muted rounded-full w-4/5 mx-auto" />
                  <div className="h-3 bg-muted/60 rounded-full w-3/5 mx-auto" />
                </div>

                <div className="mt-6 px-4 py-1.5 rounded-lg border border-dashed border-accent/30 text-xs font-medium text-accent font-devanagari chalk-text">
                  नेपाली पाठ पहिचान र डिजिटलाइजेशन
                </div>
              </div>

              <div className="scan-line" />
            </div>

            {/* Floating notebook card */}
            <motion.div
              className="notebook-card absolute -bottom-6 -left-6 p-4 rounded-xl shadow-xl flex items-center gap-3 text-xs hidden sm:flex"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="w-10 h-10 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center text-success">
                <FileText className="h-5 w-5" size={20} />
              </div>
              <div>
                <p className="font-semibold text-foreground">Devanagari Accuracy</p>
                <p className="text-muted-foreground">High Precision Glyphs</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Devanagari frieze bottom */}
      <div className="devanagari-frieze text-xs sm:text-sm py-2 sm:py-3 border-t border-border/20 mt-8">
        {DEV_FRIEZE_SHUFFLED.map((ch, i) => (
          <span key={i} className="hover:opacity-60 transition-opacity cursor-default">{ch}</span>
        ))}
      </div>
    </section>
  )
}
