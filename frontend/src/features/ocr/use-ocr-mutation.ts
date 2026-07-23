import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

interface OCRResult {
  text: string
  confidence?: number
  engine: string
  metadata?: Record<string, any>
}

export function useOcrMutation() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('image', file)
      return apiClient<OCRResult>('/api/v1/ocr', {
        method: 'POST',
        body: formData,
      })
    },
  })
}