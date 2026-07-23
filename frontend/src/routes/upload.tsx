import { useState } from 'react'
import { Navbar } from '@/components/navbar'
import { OcrUpload } from '@/features/ocr/ocr-upload'
import { useAuth } from '@/lib/auth-context'
import { Link } from '@tanstack/react-router'

export function UploadPage() {
  const { isAuthenticated } = useAuth()
  const [showBanner] = useState(!isAuthenticated)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-4 sm:px-6 lg:px-8">
        {showBanner && (
          <div className="max-w-5xl mx-auto mb-8 bg-accent/10 border border-accent/30 rounded-xl p-4 text-center">
            <p className="text-accent text-sm font-medium">
              You're using the anonymous tier — 10 OCR requests/day.{' '}
              <Link to="/register" className="font-semibold underline hover:opacity-80">
                Sign up free
              </Link>{' '}
              for 25 requests/day.
            </p>
          </div>
        )}
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl sm:text-5xl font-serif-display font-bold text-foreground chalk-text">
            Nepali OCR Converter
          </h2>
          <span className="chalk-underline block mx-auto w-20 h-1 mt-2 mb-4" />
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload your document and extract text instantly.
          </p>
        </div>
        <OcrUpload />
      </div>
    </div>
  )
}