# @syncforge/database

Prisma/PostgreSQL persistence for SyncForge.

```bash
pnpm --filter @syncforge/database db:generate
pnpm --filter @syncforge/database db:migrate:deploy
pnpm --filter @syncforge/database db:health
```

The analysis pipeline stores paths, import facts, and derived architecture metadata. It does **not** store repository source contents or GitHub credentials.
