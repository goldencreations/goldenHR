/**
 * GoldenHR API client.
 *
 * Token authentication, deliberately cookie-free: the session is a bearer
 * token issued by POST /api/auth/login, kept in localStorage and sent as
 * an Authorization header. Nothing here depends on the browser accepting
 * cookies, so locked-down browsers, blockers and http pages all sign in
 * the same way.
 *
 * The trade-off is stated plainly: a token in localStorage is readable by
 * page scripts, so an XSS bug could leak a session. Mitigations are that
 * the token is only ever sent as a header (never rendered), the API
 * enforces an explicit CORS origin allowlist, and signing out revokes the
 * token server-side.
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') ?? 'https://hr-api.goldencreations.online'

const TOKEN_KEY = 'goldenhr.token'

function readToken(): string | null {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    // Private mode without storage: the session simply lasts until reload.
    return null
  }
}

function writeToken(token: string | null): void {
  if (typeof window === 'undefined') return

  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token)
    else window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage unavailable; the in-memory session still works until reload */
  }
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

/*
 * GET response cache with stale scoping per endpoint.
 *
 * Lists and aggregates barely change second to second, but every portal
 * click used to refetch them. Reads now share in-flight requests (a burst
 * of mounts triggers one call) and reuse fresh responses for a short TTL.
 * Mutations bypass through invalidateCache, called by the data provider
 * after every write, so a decision is always followed by a live reload
 * while untouched collections stay instant.
 */

type CacheEntry = { at: number; data: unknown }

const responseCache = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<unknown>>()

const CACHE_TTLS: [string, number][] = [
  ['/api/contract-types', 300_000],
  ['/api/leave-types', 300_000],
  ['/api/money-request-types', 300_000],
  ['/api/document-categories', 300_000],
  ['/api/dashboard', 30_000],
  ['/api/me/dashboard', 30_000],
  ['/api/reports/monthly', 45_000],
  ['/api/notifications', 15_000],
]

const DEFAULT_TTL = 20_000

function cacheTtl(path: string): number {
  for (const [prefix, ttl] of CACHE_TTLS) {
    if (path.startsWith(prefix)) return ttl
  }

  return DEFAULT_TTL
}

/** Drop cached GETs, either everything or one endpoint family. */
export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    responseCache.clear()
    return
  }

  for (const key of responseCache.keys()) {
    if (key.startsWith(`GET ${prefix}`)) responseCache.delete(key)
  }
}

/** Prefetch a GET into the cache without waiting for it. */
export function prefetch(path: string): void {
  void apiFetch(path).catch(() => {})
}

async function request<T>(path: string, options: RequestOptions): Promise<T> {
  const { method = 'GET', body, form, signal } = options

  const headers: Record<string, string> = { Accept: 'application/json' }

  // FormData must set its own multipart boundary, so no Content-Type here.
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const token = readToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  // Cacheable reads share one in-flight request and reuse fresh responses.
  // Anything else (writes, uploads, aborted calls) always hits the wire.
  const cacheable = method === 'GET' && !signal && form === undefined
  const cacheKey = `${method} ${path}`

  if (cacheable) {
    const hit = responseCache.get(cacheKey)

    if (hit && Date.now() - hit.at < cacheTtl(path)) return hit.data as T

    const running = inflight.get(cacheKey)
    if (running) return running as Promise<T>
  }

  const task = (async (): Promise<T> => {
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

    const isJson = (response.headers.get('content-type') ?? '').includes('application/json')
    const payload = isJson ? await response.json().catch(() => null) : null

    if (!response.ok) {
      const message =
        (payload as { message?: string } | null)?.message ??
        `Request failed (${response.status}).`

      throw new ApiError(message, response.status, (payload as { errors?: Record<string, string[]> })?.errors ?? {})
    }

    return payload as T
  })()

  if (!cacheable) return task

  inflight.set(cacheKey, task)

  try {
    const data = await task
    responseCache.set(cacheKey, { at: Date.now(), data })
    return data
  } finally {
    inflight.delete(cacheKey)
  }
}

/**
 * Sign in with the database account. The backend checks the email and
 * password against goldenhr_db.users and returns a bearer token plus the
 * user record; the portal (HR vs Employee) is decided from the returned
 * role, never from anything stored locally. Throws ApiError with the
 * backend message, which is deliberately identical for an unknown address
 * and a wrong password.
 */
export async function login(email: string, password: string): Promise<AuthUser> {
  const data = await apiFetch<{ token: string; user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    body: { email, password, device_name: 'web' },
  })

  writeToken(data.token)

  return data.user
}

/**
 * The signed-in user, or null when there is no token or it is no longer
 * valid. An expired token is discarded so the app returns to the login
 * screen instead of failing every later request.
 */
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  if (!readToken()) return null

  try {
    const data = await apiFetch<{ user: AuthUser }>('/api/auth/me')
    return data.user
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      // A revoked or expired token must not leave the app signed in.
      writeToken(null)
      return null
    }

    throw error
  }
}

export async function logout(): Promise<void> {
  try {
    if (readToken()) await apiFetch('/api/auth/logout', { method: 'POST' })
  } catch {
    /* the token is forgotten below regardless */
  }

  writeToken(null)
}

/**
 * Download a file the API guards per user (payslip/contract/receipt PDFs,
 * stored documents). Plain links cannot carry the bearer token, so the
 * file is fetched with it and saved from a blob URL instead. Accepts an
 * API path or a full URL. Throws ApiError on failure.
 */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const url = /^https?:\/\//i.test(path) ? path : `${API_BASE}${path}`
  const token = readToken()

  const headers: Record<string, string> = { Accept: '*/*' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(url, { headers, credentials: 'include' })

  if (!response.ok) {
    const payload = await response
      .json()
      .catch(() => null)
    const message =
      (payload as { message?: string } | null)?.message ??
      `Download failed (${response.status}).`
    throw new ApiError(message, response.status)
  }

  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(objectUrl), 5000)
}
