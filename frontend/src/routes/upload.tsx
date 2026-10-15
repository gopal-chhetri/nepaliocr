import { useState } from 'react'
import { OcrUpload } from '@/features/ocr/ocr-upload'
import { useAuth } from '@/lib/auth-context'
import { Link } from '@tanstack/react-router'

export function UploadPage() {
  const { isAuthenticated } = useAuth()
  const [showBanner] = useState(!isAuthenticated)

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-24 pb-16 container mx-auto px-4 sm:px-6 lg:px-8">
        {showBanner && (
          <div className="max-w-5xl mx-auto mb-8 bg-accent/10 border border-accent/30 rounded-md p-4 text-center">
            <p className="text-accent text-sm font-medium">
              You're using the anonymous tier: 10 OCR requests/day.{' '}
              <Link to="/register" className="font-semibold underline decoration-2 underline-offset-4 hover:text-foreground">
                Sign up free
              </Link>{' '}
              for 25 requests/day.
            </p>
          </div>
        )}
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl sm:text-4xl font-serif-display font-bold text-foreground">
            Read a Nepali page
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload a photo or scan. The extracted text appears next to it, ready to edit and copy.
          </p>
        </div>
        <OcrUpload />
      </div>
    </div>
  )
}