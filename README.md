# SyncForge

SyncForge is a collaborative architecture intelligence platform. This repository is organized as a pnpm TypeScript monorepo.

## Requirements

- Node.js 24 or newer
- pnpm 11 (the exact project version is declared in `package.json`)

With Corepack available, activate the declared package-manager version:

```sh
corepack install
```

## Setup

```sh
pnpm install --frozen-lockfile
```

For the first install before a lockfile exists, use `pnpm install`. Commit the generated lockfile; subsequent installs should use the frozen command above.

Copy `.env.example` for local development or `.env.test.example` for tests to the environment file consumed by the relevant application. Environment schemas must use `@syncforge/config` and fail during startup when required values are missing or invalid.

## Baseline commands

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check
```

`pnpm check` runs the complete local/CI quality contract. Use `pnpm format:write`
to apply the repository formatting policy. Workspace packages expose their own
`build`, `typecheck`, and `test` scripts as they are introduced.

## Repository layout

```text
apps/
  api/       NestJS API (Task 0.4)
  web/       Next.js App Router web shell (Task 0.5)
packages/    Shared packages created only when a concrete contract requires them
```

Database setup and migration commands are documented in `packages/database/README.md`.
API setup, environment requirements, and focused commands are documented in `apps/api/README.md`.
Web routes, scope, and focused commands are documented in `apps/web/README.md`.

Package names use the `@syncforge/*` scope. Files and directories use lowercase kebab-case unless a framework convention requires otherwise.
