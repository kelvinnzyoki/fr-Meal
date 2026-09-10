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

// Every request sends credentials so the httpOnly kg_access / kg_refresh
// cookies travel with it — this is why the backend's CORS config must list
// this app's exact origin with credentials: true (see backend/src/app.ts).
async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
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
