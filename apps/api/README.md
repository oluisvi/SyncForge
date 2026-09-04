# `@syncforge/api`

NestJS HTTP API for SyncForge.

## Environment

- `DATABASE_URL` — direct PostgreSQL URL consumed by `@syncforge/database`.
- `API_CORS_ORIGIN` — required browser origin using HTTP(S), without credentials,
  path, query, or fragment.
- `API_PORT` — optional listen port from 1 through 65535; defaults to `3001`.
- `NODE_ENV` — `development`, `test`, or `production`; defaults to `development`.

Configuration is validated before Nest creates or listens on the application. Error
messages identify invalid keys but never echo supplied values.

## Commands

Run these through pnpm from the repository root:

```sh
pnpm --filter @syncforge/api build
pnpm --filter @syncforge/api typecheck
pnpm --filter @syncforge/api test
pnpm --filter @syncforge/api start
```

The version-neutral health endpoint is `GET /api/health`. Other controllers use URI
versioning and default to version 1 under `/api/v1`.

## Authentication

- `POST /api/v1/auth/signup` accepts `email` and `password`, canonicalizes the
  email address, and always returns `202 { "accepted": true }` for both new and
  existing accounts.
- `POST /api/v1/auth/login` verifies credentials and returns the public user
  identity. Invalid credentials use the same generic `401` response whether the
  email is unknown or the password is wrong.
- Signup passwords must contain 15 through 128 characters. Password values are
  never trimmed or normalized and are stored only as salted Argon2id hashes.
- Authentication responses are marked `Cache-Control: no-store` and both
  endpoints have process-local per-IP rate limits. A distributed limiter is
  required before horizontally scaling the API.

Authentication in Task 1.1 verifies identity only. It does not create a session,
cookie, or token; session lifecycle belongs to Task 1.2.
