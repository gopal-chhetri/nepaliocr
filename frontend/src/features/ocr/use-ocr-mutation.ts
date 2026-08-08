import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

interface OCRResult {
  text: string
  confidence?: number
  engine: string
  metadata?: Record<string, any>
}

export interface OcrInput {
  file?: File
  imageKey?: string
  purpose?: 'ocr' | 'sample'
}

export function useOcrMutation() {
  return useMutation({
    mutationFn: async ({ file, imageKey, purpose = 'ocr' }: OcrInput) => {
      const formData = new FormData()
      if (file) {
        formData.append('image', file)
      } else if (imageKey) {
        formData.append('image_key', imageKey)
      } else {
        throw new Error('No image provided')
      }
      formData.append('purpose', purpose)
      return apiClient<OCRResult>('/api/v1/ocr', {
        method: 'POST',
        body: formData,
      })
    },
  })
}