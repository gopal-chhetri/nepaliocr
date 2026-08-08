import { apiClient } from '@/lib/api-client'

export interface PresignResult {
  key: string
  url: string
  expires_in: number
}

export type PresignSection = 'ocr' | 'sample' | 'uploads' | 'rendered'

/** Request a presigned PUT URL so the browser can upload straight to MinIO. */
export async function presignUpload(
  payload: { filename: string; content_type: string; size: number; section: PresignSection },
): Promise<PresignResult> {
  return apiClient<PresignResult>('/api/v1/storage/presign-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

/** Upload a File to a presigned PUT url (MinIO). */
export async function uploadToPresigned(url: string, file: File): Promise<Response> {
  return fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  })
}

/** Fetch a short-lived presigned GET URL for an object key (e.g. 'ocr/<id>.png'). */
export async function getStorageUrl(key: string): Promise<string> {
  const res = await apiClient<{ url: string }>('/api/v1/storage/presign-get', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  })
  return res.url
}

/** Current daily OCR usage for the badge. */
export interface DailyUsage {
  limit: number
  used: number
  remaining: number
}

export async function getDailyUsage(): Promise<DailyUsage> {
  return apiClient<DailyUsage>('/api/v1/usage')
}