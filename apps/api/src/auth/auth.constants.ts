export const AUTH_RATE_LIMIT_ENDPOINT = Symbol("AUTH_RATE_LIMIT_ENDPOINT");

export const AUTH_RATE_LIMITS = Object.freeze({
  minute: Object.freeze({ limit: 10, windowMs: 60_000 }),
  hour: Object.freeze({ limit: 100, windowMs: 3_600_000 }),
  maxKeys: 10_000,
});
