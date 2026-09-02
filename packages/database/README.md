# `@syncforge/database`

PostgreSQL and Prisma foundation shared by server-side SyncForge applications.

## Local workflow

Start a named local Prisma Postgres instance without Docker:

```sh
pnpm --filter @syncforge/database db:dev -- --detach
```

The command prints a direct PostgreSQL URL. Set that value as `DATABASE_URL` in your uncommitted local environment file, then run:

```sh
pnpm --filter @syncforge/database db:migrate:deploy
pnpm --filter @syncforge/database db:generate
pnpm --filter @syncforge/database db:health
```

Use `db:migrate:dev -- --name <migration-name>` when intentionally creating a development migration. Use `db:migrate:deploy` to apply committed migrations in tests, staging, and production.

For an isolated test database, run `pnpm --filter @syncforge/database db:dev:test -- --detach`. It uses database port `51224`, matching `.env.test.example`.

The initial migration establishes only the migration workflow. Product tables belong to their specific domain tasks.
