const API_BASE = import.meta.env.VITE_NEPALI_OCR_SERVER || ''

function getToken(): string | null {
  return localStorage.getItem('auth_token')
}

/** Fired when the server rejects the stored token, so auth state can reset. */
export const AUTH_EXPIRED_EVENT = 'auth:expired'

/** Pull a readable message out of FastAPI's `detail`, which may be a string or an object. */
function errorMessage(body: any, status: number): string {
  const detail = body?.detail
  if (typeof detail === 'string') return detail
  if (detail && typeof detail === 'object') {
    if (typeof detail.detail === 'string') return detail.detail
    if (typeof detail.message === 'string') return detail.message
    if (typeof detail.error === 'string') return detail.error
  }
  return `Request failed (${status})`
}

export async function apiClient<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  // Expired or invalid session: sign out locally and retry once as anonymous.
  // Auth endpoints return 401 for bad credentials, so they're excluded.
  if (res.status === 401 && token && !path.startsWith('/api/v1/auth/')) {
    clearAuthToken()
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
    return apiClient<T>(path, options)
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(errorMessage(body, res.status))
  }

  return res.json()
}

export function setAuthToken(token: string) {
  localStorage.setItem('auth_token', token)
}

export function clearAuthToken() {
  localStorage.removeItem('auth_token')
}