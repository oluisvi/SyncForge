# SyncForge Project Instructions

## Product and sources of truth

SyncForge is a collaborative architecture intelligence platform. The canvas is the product core.

Apply project decisions in this order:

1. Latest explicit user instruction.
2. `SyncForge_Discovery_Briefing_Inicial.md`.
3. Approved task handoffs in `docs/handoffs/`.
4. `HYPER_MASTER_v3.md` and the master execution prompt.
5. Existing repository contracts and implementation.

Execute one roadmap task at a time. End each completed task with a concise handoff in `docs/handoffs/TASK_<ID>.md`, then stop unless the user explicitly requested continued autonomous execution.

## Stack and structure

- Package manager: pnpm 11 only; use the version pinned in the root `package.json`.
- Runtime: Node.js 24 or newer.
- Language: strict TypeScript with shared defaults in `tsconfig.base.json`.
- `apps/api`: NestJS API.
- `apps/web`: Next.js web application.
- `packages/config`: typed environment validation.
- `packages/database`: PostgreSQL and Prisma foundation.
- Internal packages use the `@syncforge/*` scope.
- Add shared packages only for concrete cross-application contracts.

## Commands

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check
```

TypeScript 7 is the project compiler. The root also aliases the TypeScript 6 API
for ESLint compatibility during the TypeScript 7.0 transition; do not collapse
the two entries until `typescript-eslint` supports the TypeScript 7 API.

Database commands are documented in `packages/database/README.md`. Use committed migrations for schema changes and `db:migrate:deploy` outside local migration authoring.

## Conventions and constraints

- Use pnpm exclusively and pin dependency versions exactly.
- Reuse existing packages and patterns before adding dependencies.
- Applications own their environment schemas and validate them at startup with `@syncforge/config`.
- Never include supplied environment values in validation errors.
- Keep server secrets separate from variables explicitly intended for browser exposure.
- Generated Prisma Client output is build-generated and must not be committed.
- Do not model product domains before their owning roadmap task.
- Repository-analysis code must treat repositories as untrusted input, exclude secrets and generated/vendor content, and never execute analyzed code.
- Preserve the distinction between detected facts, inferences, and AI recommendations.
- Keep changes scoped to the current task; record unrelated findings without opportunistic refactors.

## Validation

Start with the smallest relevant test, then run affected workspace typecheck/build. Before committing a completed task, run `pnpm check`, `git diff --check`, and any task-specific security or migration checks.

For database changes, also run Prisma schema validation, formatting checks, migration status/application against an isolated database, and a real connectivity health check when the environment permits.

Do not commit or push unless the required gates pass. Task commits should include the task ID or scope clearly; push completed verified tasks to `origin/main`.
