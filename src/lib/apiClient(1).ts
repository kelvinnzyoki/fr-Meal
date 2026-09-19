const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  errors?: { path: string; message: string }[];
  constructor(message: string, status: number, errors?: { path: string; message: string }[]) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  body?: unknown;
}

// Paths where a 401 means something other than "the access token expired,
// refresh and retry":
// - /auth/refresh itself — retrying a failed refresh by calling refresh
//   again would just recurse.
// - /auth/login — a 401 there means wrong phone/email/password, not an
//   expired session. Silently retrying would resend the exact same
//   (still-wrong) credentials and confuse the error the user sees.
const NO_REFRESH_RETRY = ["/auth/refresh", "/auth/login"];

// Access tokens are short-lived (15 min) by design; outliving one during
// normal use (browse → customize → add to cart) is completely normal, not
// a real logout. Rather than surface "Session expired" for that, call
// /auth/refresh once and transparently retry — the same flow /auth/me
// already relies on to keep someone logged in across a page reload.
//
// Concurrent 401s (e.g. two widgets fetching at once) share ONE refresh
// call rather than each firing their own: the backend's refresh handler
// rotates (revokes) the old refresh token on every call, so two
// independent refresh calls racing each other would have the second one
// fail against an already-revoked token. This dedupes them.
let refreshPromise: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// Every request sends credentials so the httpOnly kg_access / kg_refresh
// cookies travel with it — this is why the backend's CORS config must list
// this app's exact origin with credentials: true (see backend/src/app.ts).
async function request<T>(path: string, opts: RequestOptions = {}, allowRefresh = true): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    method: opts.method ?? "GET",
    headers: opts.body ? { "Content-Type": "application/json" } : undefined,
    credentials: "include",
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    // no body
  }

  const payload = json as { success?: boolean; data?: T; message?: string; errors?: { path: string; message: string }[] } | null;

  if (res.status === 401 && allowRefresh && !NO_REFRESH_RETRY.includes(path)) {
    const refreshed = await attemptRefresh();
    if (refreshed) {
      return request<T>(path, opts, false); // one retry only — never loop
    }
  }

  if (!res.ok || payload?.success === false) {
    throw new ApiError(payload?.message ?? `Request failed (${res.status})`, res.status, payload?.errors);
  }

  return (payload?.data ?? (payload as unknown)) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
