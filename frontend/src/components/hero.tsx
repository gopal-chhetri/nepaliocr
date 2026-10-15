import { ArrowRight } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'

const SAMPLE_LINES = [
  'नेपाल एक सुन्दर देश हो।',
  'यहाँ हिमाल, पहाड र तराई गरी',
  'तीन भौगोलिक क्षेत्र छन्।',
]

export function Hero() {
  return (
    <section id="home" className="bg-background py-16 sm:py-24 border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 items-center gap-12 lg:gap-16">
          <div className="space-y-8 text-center lg:text-left">
            <h1 className="font-serif-display text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-foreground">
              Photograph a Nepali page.{' '}
              <span className="text-accent">Get text you can edit.</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed mx-auto lg:mx-0">
              NepaliOCR reads printed Devanagari from scans, book pages and phone photos, and
              gives you Unicode text you can copy, correct and paste into any document.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link to="/upload" className="w-full sm:w-auto">
                <Button variant="chalk" size="lg" className="w-full sm:w-auto px-8">
                  Upload a page
                  <ArrowRight className="ml-2" size={16} />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="chalk-outline"
                className="w-full sm:w-auto px-8"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                How it works
              </Button>
            </div>

            <ul className="flex flex-wrap justify-center lg:justify-start gap-x-8 gap-y-2 text-sm text-muted-foreground">
              <li>Free, no account needed</li>
              <li>Images deleted within 24 hours</li>
            </ul>
          </div>

          {/* Before / after: what goes in, what comes out */}
          <figure className="grid sm:grid-cols-2 gap-4 w-full max-w-xl mx-auto lg:max-w-none">
            <div className="relative overflow-hidden rounded-lg border border-border bg-card p-6 -rotate-1">
              <figcaption className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Your photo
              </figcaption>
              <div className="font-devanagari text-lg leading-loose text-foreground/80 blur-[0.4px] grayscale">
                {SAMPLE_LINES.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <div className="scan-line" />
            </div>

            <div className="rounded-lg border border-border bg-background p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Extracted text
                </span>
                <span className="text-xs font-semibold text-accent">Unicode</span>
              </div>
              <div className="font-devanagari text-lg leading-loose text-foreground select-all">
                {SAMPLE_LINES.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>
          </figure>
        </div>
      </div>
    </section>
  )
}
