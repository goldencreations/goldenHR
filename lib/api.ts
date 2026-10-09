/**
 * GoldenHR API client.
 *
 * The API lives on a different origin, so requests are authenticated with a
 * bearer token issued by POST /api/auth/login. The token is held in
 * localStorage: the app is a static export with no server, so there is no
 * httpOnly cookie available.
 *
 * That choice has a trade-off worth stating plainly. A token in
 * localStorage is readable by any script on the page, so an XSS bug would
 * leak a session. The alternative, an httpOnly cookie, would need the
 * frontend to be served from the API origin. Mitigations here: the token
 * is only ever sent as an Authorization header, never interpolated into
 * markup, and no HTML is ever rendered from API data.
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') ?? 'https://hr-api.goldencreations.online'

const TOKEN_KEY = 'goldenhr.token'

export type AuthUser = {
  id: number
  name: string
  email: string
  role: 'hr_admin' | 'hr_officer' | 'employee'
  is_hr: boolean
  employee: {
    id: number
    employee_code: string
    first_name: string
    last_name: string
    full_name: string
    employment_type: string
    profile_image_path: string | null
    department: string | null
    job_role: string | null
  } | null
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly errors: Record<string, string[]> = {},
  ) {
    super(message)
    this.name = 'ApiError'
  }

  /** Field-level messages from Laravel validation, for form display. */
  fieldErrors(): string[] {
    return Object.values(this.errors).flat()
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    // Private browsing or a blocked storage partition.
    return null
  }
}

export function setToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* session simply will not persist across reloads */
  }
}

export function clearToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* nothing to do */
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  /** Send as FormData rather than JSON, for file uploads. */
  form?: FormData
  signal?: AbortSignal
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, form, signal } = options

  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = getToken()

  if (token) headers.Authorization = `Bearer ${token}`

  // FormData must set its own multipart boundary, so no Content-Type here.
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
      signal,
    })
  } catch (cause) {
    if ((cause as Error)?.name === 'AbortError') throw cause

    /*
     * A blocked cross-origin request fails here as an opaque TypeError, and
     * the console shows a CORS error rather than anything this catch can
     * inspect. Reporting it as a plain network failure sends people looking
     * at their connection, so the message names the likely cause.
     */
    throw new ApiError(
      'Could not reach the GoldenHR service. If you are running the app locally, ' +
        'check that this origin is listed in the API CORS_ALLOWED_ORIGINS setting — ' +
        'the browser reports that as a connection failure.',
      0,
    )
  }

  if (response.status === 204) return undefined as T

  const isJson = (response.headers.get('content-type') ?? '').includes('application/json')
  const payload = isJson ? await response.json().catch(() => null) : null

  if (!response.ok) {
    const message =
      (payload as { message?: string } | null)?.message ??
      `Request failed (${response.status}).`

    throw new ApiError(message, response.status, (payload as { errors?: Record<string, string[]> })?.errors ?? {})
  }

  return payload as T
}

/**
 * Sign in and store the token. Throws ApiError with the message the backend
 * returns, which is deliberately identical for an unknown address and a
 * wrong password.
 */
export async function login(email: string, password: string): Promise<AuthUser> {
  const data = await apiFetch<{ token: string; user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    body: { email, password, device_name: 'web' },
  })

  setToken(data.token)

  return data.user
}

/**
 * The signed-in user, or null when there is no token or it is no longer
 * valid. An expired token is discarded so the app returns to the login
 * screen instead of failing every later request.
 */
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  if (!getToken()) return null

  try {
    const data = await apiFetch<{ user: AuthUser }>('/api/auth/me')
    return data.user
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      clearToken()
      return null
    }
    throw error
  }
}

export async function logout(): Promise<void> {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' })
  } catch {
    // The token is dropped locally regardless, so a network failure here
    // must not leave the user apparently signed in.
  }
  clearToken()
}