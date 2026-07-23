import { useEffect } from 'react'
import { Navbar } from '@/components/navbar'
import { Hero } from '@/components/hero'
import { Features } from '@/components/features'
import { About } from '@/components/about'
import { Privacy } from '@/components/privacy'
import { OcrUpload } from '@/features/ocr/ocr-upload'

export function HomePage() {
  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (hash) {
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Features />
      <section id="ocr" className="py-24 bg-secondary/30 border-y border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-4xl sm:text-5xl font-serif-display font-bold text-foreground">
              Nepali OCR Converter
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Upload your document and watch as it's transformed into digital text in seconds.
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