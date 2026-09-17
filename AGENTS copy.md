# SyncForge Project Instructions

SyncForge is a collaborative architecture intelligence platform. The canvas is the product core.

## Sources of truth
1. Latest explicit user instruction.
2. `docs/sources/SyncForge_Discovery_Briefing_Inicial.md`.
3. Approved task handoffs in `docs/handoffs/`.
4. `docs/sources/HYPER_MASTER_v4.txt` and `docs/sources/UNIVERSAL_ADAPTIVE_DESIGN_SYSTEM.md`.
5. Existing repository contracts and implementation.

## Stack
- pnpm 11, Node 24+, strict TypeScript.
- `apps/api`: NestJS API.
- `apps/web`: Next.js product UI.
- `packages/config`: typed environment validation.
- `packages/database`: PostgreSQL + Prisma.

## Security
- Analyze repository text; never execute repository code.
- Never persist GitHub tokens or source-file contents from analysis.
- Keep browser-exposed config separate from server secrets.
- Validate authorization at every organization/project/canvas boundary.
- Prefer granular, idempotent architecture operations over whole-canvas overwrites.

## Validation
Run focused tests first, then `pnpm check` before release when Node 24/pnpm 11 and dependencies are available.
