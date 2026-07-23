'use client'
import { Navbar } from '@/components/navbar'
import { Hero } from '@/components/hero'
import { Features } from '@/components/features'
import { OcrUpload } from '@/components/ocr-upload'
import { About } from '@/components/about'
import { Privacy } from '@/components/privacy'
import { motion } from 'framer-motion'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Features />
      <section
        id="ocr"
        className="py-24 bg-gradient-to-br from-secondary-50 via-white to-primary-50"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center space-y-4 mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            viewport={{ once: true, amount: 0.5 }}
          >
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-foreground">
              Nepali OCR Converter
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the power of AI-driven Nepali handwriting recognition.
              Upload your document and watch as it&apos;s transformed into
              digital text in seconds.
            </p>
          </motion.div>
          <OcrUpload />
        </div>
      </section>
      <About />
      <Privacy />
    </div>
  )
}
