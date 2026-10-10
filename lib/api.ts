/**
 * GoldenHR API client.
 *
 * The API lives on a different origin, so every request must be explicitly
 * credentialed. Sessions are held in an HttpOnly cookie issued by Sanctum:
 * page scripts cannot read it, so an XSS bug cannot exfiltrate a session.
 *
 * Cookie auth means CSRF applies. The client therefore asks for
 * /sanctum/csrf-cookie once before signing in, and Laravel reads the
 * resulting XSRF-TOKEN cookie, which is readable precisely so it can be sent
 * back as a header. That cookie is the only session-related value JS touches.
 *
 * A bearer token is still accepted by the API for non-browser callers.
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') ?? 'https://hr-api.goldencreations.online'

/** Readable companion to the HttpOnly session cookie, echoed back as a header. */
const CSRF_COOKIE = 'XSRF-TOKEN'

let csrfReady: Promise<void> | null = null

/**
 * Fetch the CSRF cookie once per page load. Safe to call repeatedly: the
 * in-flight promise is shared so a burst of requests triggers one call.
 */
export function ensureCsrfCookie(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()

  csrfReady ??= fetch(`${API_BASE}/sanctum/csrf-cookie`, {
    method: 'GET',
    credentials: 'include',
  })
    .then((response) => {
      // A failed bootstrap must not be cached, or every later request would
      // reuse a cookie that was never set.
      if (!response.ok) {
        csrfReady = null
        throw new Error(`CSRF bootstrap failed with ${response.status}.`)
      }
    })
    .catch((error) => {
      csrfReady = null
      throw error
    })

  return csrfReady
}

function readCsrfToken(): string | null {
  if (typeof document === 'undefined') return null

  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

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

/**
 * Whether a session cookie is likely present.
 *
 * The cookie itself is HttpOnly and cannot be inspected, so this only checks
 * the readable CSRF companion. It is a hint for deciding whether to attempt
 * /api/auth/me on load, never an authorisation check: the API is the only
 * thing that can say whether the session is actually valid.
 */
export function hasSessionCookie(): boolean {
  return readCsrfToken() !== null
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

  return request<T>(path, { method, body, form, signal })
}

/** Methods that can change state and therefore need a CSRF token. */
const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

async function request<T>(path: string, options: RequestOptions, retried = false): Promise<T> {
  const { method = 'GET', body, form, signal } = options

  const headers: Record<string, string> = { Accept: 'application/json' }

  // FormData must set its own multipart boundary, so no Content-Type here.
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  if (UNSAFE.has(method)) {
    // Obtain the CSRF cookie before the first state-changing call of the
    // session, then echo it back as the header Laravel checks.
    await ensureCsrfCookie()
    const csrf = readCsrfToken()

    if (csrf) headers['X-XSRF-TOKEN'] = csrf
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      credentials: 'include',
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

  /*
   * 419 means Laravel rejected the CSRF token: the session cookie and the
   * XSRF token disagreed, which happens after the session rotates or on a
   * page restored from cache. Refreshing the CSRF cookie and replaying once
   * recovers transparently. Retrying more than that would mask a genuine
   * mismatch as an infinite loop.
   */
  if (response.status === 419 && !retried) {
    csrfReady = null
    await ensureCsrfCookie()
    return request<T>(path, options, true)
  }

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
 * Sign in. The session is set by an HttpOnly cookie on the response, so
 * nothing is stored on the client. Throws ApiError with the backend message,
 * which is deliberately identical for an unknown address and a wrong
 * password.
 */
export async function login(email: string, password: string): Promise<AuthUser> {
  const data = await apiFetch<{ user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    body: { email, password, device_name: 'web' },
  })

  return data.user
}

/**
 * The signed-in user, or null when there is no token or it is no longer
 * valid. An expired token is discarded so the app returns to the login
 * screen instead of failing every later request.
 */
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    // Always asked: only the API can say whether the cookie is still valid,
    // and a cheap miss just returns null.
    const data = await apiFetch<{ user: AuthUser }>('/api/auth/me')
    return data.user
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      // An expired or rejected session must not leave the app signed in.
      csrfReady = null
      return null
    }

    throw error
  }
}

export async function logout(): Promise<void> {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' })
  } catch {
    /*
     * The cookie may survive a network failure. Forget the cached CSRF value
     * regardless so the next sign-in bootstraps a fresh pair rather than
     * reusing a token from the session that just ended.
     */
  }

  csrfReady = null
}