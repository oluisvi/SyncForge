export const SESSION_COOKIE = "syncforge_session";

export function parseCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const pair of header.split(";")) {
    const separator = pair.indexOf("=");
    if (separator < 0) continue;
    const key = pair.slice(0, separator).trim();
    if (key !== name) continue;
    const value = pair.slice(separator + 1).trim();
    try { return decodeURIComponent(value); } catch { return undefined; }
  }
  return undefined;
}

export function buildSessionCookie(token: string, expiresAt: Date, secure: boolean): string {
  return [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    secure ? "Secure" : undefined,
    `Expires=${expiresAt.toUTCString()}`,
  ].filter(Boolean).join("; ");
}

export function buildExpiredSessionCookie(secure: boolean): string {
  return [
    `${SESSION_COOKIE}=`, "Path=/", "HttpOnly", "SameSite=Lax", secure ? "Secure" : undefined,
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT", "Max-Age=0",
  ].filter(Boolean).join("; ");
}
