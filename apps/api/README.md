# SyncForge API

NestJS API for authentication, organizations, projects, architecture canvases, comments/history, realtime event streaming, and deterministic GitHub repository analysis.

## Security model

- Opaque 256-bit session token; only SHA-256 hash is stored.
- HttpOnly, SameSite=Lax session cookie; `Secure` is environment-controlled.
- Every organization/project/canvas endpoint performs membership authorization.
- GitHub analysis excludes `.env`, secret-like paths, dependencies, generated output and oversized files.
- Repository source is read as text only and never executed or persisted.
- Public repository analysis works without a token; set server-side `GITHUB_TOKEN` for private repositories and higher rate limits.

The realtime MVP uses Server-Sent Events plus idempotent granular operations. For horizontal multi-instance deployment, replace the process-local presence/event broker with Redis pub/sub while keeping the operation contract unchanged.
