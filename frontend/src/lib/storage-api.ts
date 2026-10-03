import { apiClient } from '@/lib/api-client'

export interface PresignResult {
  key: string
  /** POST target; send every entry of `fields`, then the file as `file`. */
  url: string
  fields: Record<string, string>
  expires_in: number
}

export type PresignSection = 'uploads' | 'rendered'

/** Request a presigned POST policy so the browser can upload straight to MinIO. */
export async function presignUpload(
  payload: { filename: string; content_type: string; size: number; section: PresignSection },
): Promise<PresignResult> {
  return apiClient<PresignResult>('/api/v1/storage/presign-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

/**
 * Upload a File with a presigned POST policy (MinIO). MinIO enforces the
 * policy's key, content type and size limit, so the file must come last.
 */
export async function uploadToPresigned(presign: PresignResult, file: File): Promise<Response> {
  const form = new FormData()
  for (const [name, value] of Object.entries(presign.fields)) form.append(name, value)
  form.append('file', file)
  return fetch(presign.url, { method: 'POST', body: form })
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