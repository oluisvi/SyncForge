export const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1"
).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
    cache: "no-store",
  });
  if (response.status === 204) return undefined as T;
  const payload = (await response.json().catch(() => ({}))) as {
    error?: { code?: string; message?: string };
    message?: string | string[];
  };
  if (!response.ok) {
    const generic = Array.isArray(payload.message)
      ? payload.message.join(" · ")
      : payload.message;
    throw new ApiError(
      response.status,
      payload.error?.code ?? "REQUEST_FAILED",
      payload.error?.message ??
        generic ??
        `Request failed (${response.status})`,
    );
  }
  return payload as T;
}

export function eventSource(path: string): EventSource {
  return new EventSource(`${API_BASE}${path}`, { withCredentials: true });
}
