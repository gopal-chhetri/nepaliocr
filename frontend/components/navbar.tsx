'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import Image from 'next/image'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 50)
  })

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId)
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' })
    }
    setIsMenuOpen(false)
  }

  return (
    <motion.header
      className={`w-full backdrop-blur-md sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/80 shadow-md' : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div
            className="flex items-center gap-2 flex-shrink-0 cursor-pointer"
            onClick={() => scrollToSection('home')}
          >
            <Image
              src={`assets/images/logo/logo.png`}
              alt="NepaliOCR Logo"
              width={40}
              height={40}
              className="rounded-full"
            />
            <span className="font-display text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              NepaliOCR
            </span>
          </div>

          <nav className="hidden md:flex space-x-8">
            {['Home', 'OCR', 'About', 'Privacy'].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item.toLowerCase())}
                className="text-foreground hover:text-primary transition-colors duration-200 font-medium"
              >
                {item}
              </button>
            ))}
          </nav>
          <div className="hidden md:block">
            <Button
              onClick={() => scrollToSection('ocr')}
              className="bg-primary hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-full transition-all duration-200 transform hover:scale-105"
            >
              Try Now
            </Button>
          </div>
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-foreground"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {['Home', 'OCR', 'About', 'Privacy'].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item.toLowerCase())}
                className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:text-primary hover:bg-primary-50 transition-colors duration-200 w-full text-left"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.header>
  )
}
