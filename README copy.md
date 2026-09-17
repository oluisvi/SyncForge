# SyncForge

**Collaborative Architecture Intelligence Platform** — a living, navigable map between source code, architecture knowledge and engineering collaboration.

> GitHub shows the code. SyncForge shows how the software works.

This repository continues the original foundation through a complete MVP slice: authentication and sessions, organization boundaries, projects, architecture canvas, granular collaborative operations, comments, presence, snapshots, search, GitHub code intelligence and architecture generation.

## Product surface

- **Accounts & sessions** — canonical email identities, Argon2id password hashing, opaque revocable sessions in HttpOnly cookies.
- **Organizations & RBAC** — owner/admin/member boundaries around projects.
- **Projects** — one default architecture canvas per project, repository metadata and activity.
- **Architecture canvas** — nodes, typed edges, drag/pan/zoom, inspector, viewport persistence and Mermaid export.
- **Realtime collaboration** — server-sent operation/presence/comment events plus idempotent operation IDs and offline replay queue.
- **Comments** — node-level discussion with resolve state.
- **History** — manual checkpoints and automatic snapshots every 25 operations.
- **Search** — architecture nodes, comments and analyzed file paths.
- **Code intelligence** — deterministic GitHub TS/JS/JSON/Prisma inspection, dependency/import facts, framework detection, related files and an editable initial architecture proposal.

## Architecture

```text
Browser / Next.js
      │
      ├── REST + HttpOnly session
      ├── SSE collaboration stream
      │
      ▼
NestJS API
      │
      ├── Auth / RBAC
      ├── Projects / Canvas / Comments / History
      ├── Code Intelligence (untrusted text only)
      │
      ▼
PostgreSQL / Prisma
```

The canvas is persisted as normalized nodes/edges plus a versioned operation log. `opId` is globally unique, so reconnection can replay queued changes without duplicating an already-applied operation. This MVP broadcasts live events process-locally through SSE; a multi-instance production deployment should replace the broker with Redis/Yjs or an equivalent shared collaboration transport without changing the persisted operation contract.

## Security model

- Repository source is treated as **untrusted input** and is never executed.
- `.env`, secret-like, vendor, generated, build and dependency directories are excluded from analysis.
- Files above 128 KiB are not ingested by the MVP analyzer.
- Source contents are transient. Persisted analysis stores paths, language, size and import facts — not source text.
- GitHub access tokens remain server-side and are optional for public repositories.
- Organization/project/canvas access is checked server-side to prevent IDOR.
- Passwords are hashed with Argon2id and are never normalized or logged.
- Sessions store only SHA-256 token hashes in PostgreSQL and can be revoked.

## Requirements

- Node.js 24+
- pnpm 11.19.0
- PostgreSQL 16+ recommended

## Environment

Copy `.env.example` to `.env` and configure:

```dotenv
NODE_ENV=development
API_PORT=3001
API_CORS_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/syncforge
SESSION_TTL_HOURS=168
SESSION_COOKIE_SECURE=false
GITHUB_TOKEN=
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

Set `SESSION_COOKIE_SECURE=true` behind HTTPS in production.

## Local development

```bash
corepack enable
pnpm install
pnpm --filter @syncforge/database db:migrate:deploy
pnpm dev
```

The web app runs on `http://localhost:3000`; the API defaults to `http://localhost:3001`.

For a local PostgreSQL service only:

```bash
docker compose up -d postgres
```

## Quality gates

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check
```

Database changes additionally require:

```bash
pnpm --filter @syncforge/database exec prisma validate
pnpm --filter @syncforge/database exec prisma format --check
pnpm --filter @syncforge/database db:migrate:status
```

## Repository analysis boundaries

The initial analyzer intentionally supports a controlled scope: GitHub repositories with TypeScript, JavaScript, JSON and Prisma signals, with strongest detection for Next.js/React/Node/NestJS projects. Generated architecture is a **reviewable proposal**, not an asserted truth. Facts and inferences are separated in the response/UI.

## Deployment

A practical first deployment is:

- Web: Vercel
- API: Render/Fly/other Node 24 runtime
- PostgreSQL: managed PostgreSQL
- `API_CORS_ORIGIN`: exact web origin
- `NEXT_PUBLIC_API_URL`: public API `/api/v1` URL
- `SESSION_COOKIE_SECURE=true`

For horizontal API scaling, move realtime/presence and rate limiting to shared infrastructure before adding replicas.

## Source-of-truth documents

The implementation follows the project briefing and the design/execution sources kept under `docs/sources/`. Task continuation notes live under `docs/handoffs/`.
