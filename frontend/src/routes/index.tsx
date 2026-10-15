import { Hero } from '@/components/hero'
import { Features } from '@/components/features'
import { About } from '@/components/about'
import { Privacy } from '@/components/privacy'
import { OcrUpload } from '@/features/ocr/ocr-upload'

export function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <Features />
      <section id="ocr" className="py-24 bg-secondary/40 border-y border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl sm:text-4xl font-serif-display font-bold text-foreground">
              Try it here
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Drop an image of a Nepali page below. The text appears next to it.
            </p>
          </div>
          <OcrUpload />
        </div>
      </section>
      <About />
      <Privacy />
    </div>
  )
}