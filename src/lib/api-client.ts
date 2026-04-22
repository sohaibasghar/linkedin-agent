/**
 * Generic HTTP client for internal API routes.
 *
 * - Auto-serialises JSON bodies
 * - Parses JSON responses with type inference
 * - Throws `ApiError` with status, code, and message on non-2xx
 * - Builds query strings from plain objects
 */

// ─── Error type ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** True for 401/403 */
  get isAuth() {
    return this.status === 401 || this.status === 403;
  }

  /** True for 5xx */
  get isServer() {
    return this.status >= 500;
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  /** Query string params — undefined/null values are omitted */
  params?: Record<string, string | number | boolean | undefined | null>;
  /** Request body — auto-serialised to JSON */
  body?: unknown;
  /** Extra headers merged onto defaults */
  headers?: Record<string, string>;
  /** AbortSignal for cancellation */
  signal?: AbortSignal;
}

// ─── Internals ───────────────────────────────────────────────────────────────

function buildUrl(path: string, params?: RequestOptions['params']): string {
  if (!params) return path;
  const q = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null) q.set(key, String(val));
  }
  const qs = q.toString();
  return qs ? `${path}?${qs}` : path;
}

async function request<T>(method: HttpMethod, path: string, options: RequestOptions = {}): Promise<T> {
  const url = buildUrl(path, options.params);

  const headers: Record<string, string> = { ...options.headers };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  // Handle empty responses (204, etc.)
  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    throw new ApiError(
      res.status,
      data?.error ?? 'UNKNOWN',
      data?.message ?? data?.error ?? `Request failed with status ${res.status}`,
    );
  }

  return data as T;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const api = {
  get<T>(path: string, options?: RequestOptions) {
    return request<T>('GET', path, options);
  },
  post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) {
    return request<T>('POST', path, { ...options, body });
  },
  put<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) {
    return request<T>('PUT', path, { ...options, body });
  },
  patch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) {
    return request<T>('PATCH', path, { ...options, body });
  },
  delete<T>(path: string, options?: RequestOptions) {
    return request<T>('DELETE', path, options);
  },
} as const;
