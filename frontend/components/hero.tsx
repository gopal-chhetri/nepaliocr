'use client'

import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import Image from 'next/image'

export function Hero() {
  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId)
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section
      id="home"
      className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-24 sm:py-32"
    >
      <motion.div
        className="absolute inset-0 bg-[url('/grid.svg')] bg-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        style={{
          maskImage: 'linear-gradient(180deg,white,rgba(255,255,255,0))',
          WebkitMaskImage: 'linear-gradient(180deg,white,rgba(255,255,255,0))',
        }}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <motion.div
            className="flex-1 space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-sm font-semibold text-white">
              Welcome to NepaliOCR
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-tight">
              Digitize Nepali
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
                Handwritten Docs
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-[600px] leading-relaxed">
              Join our mission to make Nepali text processing more accessible.
              Help build a better OCR system for the Nepali language.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-full transition-all duration-200 transform hover:scale-105 shadow-soft"
                onClick={() => scrollToSection('ocr')}
              >
                Try It Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary text-primary hover:bg-primary-50 font-semibold py-3 px-6 rounded-full transition-all duration-200"
                onClick={() => scrollToSection('about')}
              >
                Learn More
              </Button>
            </div>
          </motion.div>
          <motion.div
            className="flex-1"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative aspect-square">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-secondary/20 to-accent/20 rounded-3xl -rotate-6 scale-95" />
              <Image
                src={`assets/images/other_images/pencil.png`}
                alt="Nepali Handwriting"
                width={500}
                height={500}
                className="relative rounded-2xl shadow-2xl object-cover w-full h-full"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
