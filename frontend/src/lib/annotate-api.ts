import { apiClient } from '@/lib/api-client'

/* ------------------------------ Contributions ------------------------------ */

export interface ContributionCreate {
  image_key: string
  source: 'handwritten' | 'ai'
  expected_lines: string[]
}

export interface ContributionCreated {
  id: string
  status: string
}

export interface ContributionSegment {
  id: string
  index: number
  image_key: string
  image_url: string
  expected_text: string | null
  is_extra: boolean
  annotated: boolean
}

export interface Contribution {
  id: string
  image_key: string
  section: string
  source: 'handwritten' | 'ai'
  status: string
  error: string | null
  lines_requested: number
  lines_found: number | null
  created_at: string
  segments: ContributionSegment[]
}

export async function createContribution(body: ContributionCreate): Promise<ContributionCreated> {
  return apiClient<ContributionCreated>('/api/v1/contributions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function getContribution(id: string): Promise<Contribution> {
  return apiClient<Contribution>(`/api/v1/contributions/${id}`)
}

/* ------------------------------ Annotation ------------------------------ */

export interface NextAnnotationItem {
  segment_id: string
  image_url: string
  kind: string
  index: number
}

export interface NextAnnotationResponse {
  available: boolean
  reason: 'available' | 'none' | 'done'
  total: number
  done: number
  remaining: number
  next: NextAnnotationItem | null
}

export async function getNextAnnotation(exclude: string[] = []): Promise<NextAnnotationResponse> {
  const qs = exclude.length ? `?exclude=${encodeURIComponent(exclude.join(','))}` : ''
  return apiClient<NextAnnotationResponse>(`/api/v1/annotate/next${qs}`)
}

export async function submitAnnotation(
  segmentId: string,
  text: string,
): Promise<{ ok: boolean; remaining: number }> {
  return apiClient<{ ok: boolean; remaining: number }>(`/api/v1/annotate/${segmentId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
}

/* ----------------------- Legacy (kept for old dev data) ----------------------- */

export interface SampleCreate {
  image_key: string
  expected_text?: string
  ocr_text?: string
  lines?: number
}

export interface SampleCreateResponse {
  sample_id: string
  image_key: string
}

export async function createSample(body: SampleCreate): Promise<SampleCreateResponse> {
  return apiClient<SampleCreateResponse>('/api/v1/annotate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}