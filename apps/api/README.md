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
