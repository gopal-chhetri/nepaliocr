const API_BASE = import.meta.env.VITE_NEPALI_OCR_SERVER || ''

function getToken(): string | null {
  return localStorage.getItem('auth_token')
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

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail?.detail || body.detail || `Request failed (${res.status})`)
  }

  return res.json()
}

export function setAuthToken(token: string) {
  localStorage.setItem('auth_token', token)
}

export function clearAuthToken() {
  localStorage.removeItem('auth_token')
}