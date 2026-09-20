<div align="center">

# SyncForge

**Collaborative architecture intelligence for software teams.**

Turn a GitHub repository into a shared, interactive architecture canvas where teams can inspect structure, discuss decisions, and keep technical context connected to the code.

</div>

> [!NOTE]
> SyncForge is under active MVP development. The repository currently contains the authenticated web application, API, collaborative canvas foundation, and deterministic GitHub repository analysis.

## What SyncForge does

- Analyzes GitHub repositories without executing their code.
- Maps files, imports, and derived architecture metadata into a visual canvas.
- Gives teams shared projects, canvases, comments, history, and realtime updates.
- Keeps detected facts, inferences, and recommendations distinct.
- Protects repository data by excluding secrets, dependencies, generated output, and oversized files from analysis.

## Tech stack

| Area      | Technology                                            |
| --------- | ----------------------------------------------------- |
| Web       | Next.js 16, React 19, TypeScript 7                    |
| API       | NestJS 12, TypeScript                                 |
| Data      | PostgreSQL 17, Prisma ORM 7                           |
| Workspace | pnpm 11 monorepo                                      |
| Quality   | ESLint, Prettier, Node.js test runner, GitHub Actions |

## Quick start

### Prerequisites

- [Node.js](https://nodejs.org/) 24 or newer
- [pnpm](https://pnpm.io/) 11.19.0, managed through Corepack
- PostgreSQL 17, or Docker for the included local database

### 1. Install dependencies

```sh
corepack enable
corepack install
pnpm install --frozen-lockfile
```

### 2. Configure the environment

Copy the example file to `.env`:

```sh
cp .env.example .env
```

On PowerShell:

```powershell
Copy-Item .env.example .env
```

The default application addresses are:

- Web: `http://localhost:3000`
- API: `http://localhost:3001`
- Health check: `http://localhost:3001/api/health`

If you use the included Docker Compose service, set the following value in `.env`:

```dotenv
DATABASE_URL=postgres://postgres:postgres@localhost:5432/syncforge?sslmode=disable
```

### 3. Start PostgreSQL and apply migrations

```sh
docker compose up -d postgres
pnpm --filter @syncforge/database db:generate
pnpm --filter @syncforge/database db:migrate:deploy
pnpm --filter @syncforge/database db:health
```

You can use any compatible PostgreSQL instance instead. Update `DATABASE_URL` before running the migration commands.

### 4. Run SyncForge

```sh
pnpm dev
```

The root development command starts the web and API applications together.

## Repository structure

```text
.
├── apps/
│   ├── api/          # NestJS API, authentication, projects, canvas and analysis
│   └── web/          # Next.js application and interactive canvas
├── packages/
│   ├── config/       # Typed environment validation
│   └── database/     # Prisma schema, migrations and PostgreSQL client
├── docs/
│   ├── design/       # Approved design references
│   └── handoffs/     # Completed roadmap task records
└── .github/          # Continuous integration workflows
```

Internal packages use the `@syncforge/*` scope.

## Development commands

| Command             | Purpose                                    |
| ------------------- | ------------------------------------------ |
| `pnpm dev`          | Start the web and API development servers  |
| `pnpm format:check` | Check formatting                           |
| `pnpm format:write` | Apply repository formatting                |
| `pnpm lint`         | Run ESLint with zero warnings allowed      |
| `pnpm typecheck`    | Type-check every workspace                 |
| `pnpm test`         | Run the test suites                        |
| `pnpm build`        | Build every workspace                      |
| `pnpm check`        | Run the complete local and CI quality gate |

Run `pnpm check` before opening a pull request.

## Security principles

- Repository contents are treated as untrusted input and are never executed.
- Source contents and GitHub credentials are not persisted by the analysis pipeline.
- Authentication uses Argon2id password hashing and opaque server-side sessions.
- Organization, project, and canvas operations enforce membership authorization.
- Server secrets remain separate from variables explicitly exposed to the browser.

For focused setup and security details, see the documentation for the [API](apps/api/README.md), [database package](packages/database/README.md), and [configuration package](packages/config/README.md).

## Project status

SyncForge is being built roadmap task by roadmap task. Completed implementation records and their validation evidence live in [`docs/handoffs`](docs/handoffs).
