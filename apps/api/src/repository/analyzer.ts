import { createHash } from "node:crypto";

export interface SourceFact {
  path: string;
  size: number;
  language?: string;
  imports: string[];
  content?: string;
}
export interface ProposedNode {
  id: string;
  type:
    | "FRONTEND"
    | "BACKEND"
    | "SERVICE"
    | "DATABASE"
    | "CACHE"
    | "QUEUE"
    | "INFRASTRUCTURE"
    | "EXTERNAL"
    | "GENERIC";
  label: string;
  technology?: string;
  description?: string;
  x: number;
  y: number;
  metadata: Record<string, unknown>;
}
export interface ProposedEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  type: "REST" | "SQL" | "QUEUE" | "INTERNAL" | "WEBHOOK";
  label?: string;
}
export interface RepositorySummary {
  facts: {
    languages: Record<string, number>;
    technologies: string[];
    fileCount: number;
    importCount: number;
  };
  inferences: string[];
  proposal: { nodes: ProposedNode[]; edges: ProposedEdge[] };
}

const extensions = new Map([
  [".ts", "TypeScript"],
  [".tsx", "TypeScript"],
  [".js", "JavaScript"],
  [".jsx", "JavaScript"],
  [".mjs", "JavaScript"],
  [".cjs", "JavaScript"],
  [".json", "JSON"],
  [".prisma", "Prisma"],
]);
const excluded =
  /(^|\/)(node_modules|dist|build|\.next|coverage|vendor|generated|\.git|tmp|temp)(\/|$)|(^|\/)(\.env($|\.)|secrets?\b)/i;

export function parseGitHubRepositoryUrl(value: string): {
  owner: string;
  repository: string;
} {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== "github.com")
    throw new Error("Only https://github.com repositories are supported");
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2)
    throw new Error("Repository URL must include owner and repository");
  const owner = parts[0]!;
  const repository = parts[1]!.replace(/\.git$/, "");
  if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repository))
    throw new Error("Repository URL is invalid");
  return { owner, repository };
}

export function languageForPath(path: string): string | undefined {
  const lower = path.toLowerCase();
  for (const [extension, language] of extensions)
    if (lower.endsWith(extension)) return language;
  return undefined;
}
export function shouldAnalyzePath(path: string, size: number): boolean {
  return (
    size <= 128 * 1024 &&
    !excluded.test(path) &&
    languageForPath(path) !== undefined
  );
}
export function extractImports(content: string): string[] {
  const imports = new Set<string>();
  const patterns = [
    /\b(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g,
    /\brequire\(\s*["']([^"']+)["']\s*\)/g,
    /\bimport\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const pattern of patterns)
    for (const match of content.matchAll(pattern))
      if (match[1]) imports.add(match[1]);
  return [...imports].slice(0, 200);
}

function packageDependencies(files: readonly SourceFact[]): Set<string> {
  const deps = new Set<string>();
  for (const file of files) {
    if (!file.path.endsWith("package.json") || !file.content) continue;
    try {
      const parsed = JSON.parse(file.content) as {
        dependencies?: Record<string, unknown>;
        devDependencies?: Record<string, unknown>;
      };
      for (const name of [
        ...Object.keys(parsed.dependencies ?? {}),
        ...Object.keys(parsed.devDependencies ?? {}),
      ])
        deps.add(name);
    } catch {
      /* malformed metadata remains an ignored fact */
    }
  }
  return deps;
}
function related(files: readonly SourceFact[], matcher: RegExp): string[] {
  return files
    .filter((f) => matcher.test(f.path))
    .map((f) => f.path)
    .slice(0, 30);
}
function idFor(label: string): string {
  return `detected-${createHash("sha1").update(label).digest("hex").slice(0, 12)}`;
}
function edgeId(source: string, target: string, type: string): string {
  return `detected-edge-${createHash("sha1").update(`${source}:${target}:${type}`).digest("hex").slice(0, 12)}`;
}

export function summarizeRepository(
  files: readonly SourceFact[],
): RepositorySummary {
  const deps = packageDependencies(files);
  const technologies = new Set<string>();
  const has = (name: string) => deps.has(name);
  if (has("next")) technologies.add("Next.js");
  if (has("react")) technologies.add("React");
  if (has("@nestjs/core")) technologies.add("NestJS");
  if (has("express")) technologies.add("Express");
  if (
    has("@prisma/client") ||
    files.some((f) => f.path.endsWith("schema.prisma"))
  )
    technologies.add("Prisma");
  if (has("pg")) technologies.add("PostgreSQL");
  if (has("redis") || has("ioredis")) technologies.add("Redis");
  if (has("bullmq")) technologies.add("BullMQ");
  if (has("socket.io") || has("ws")) technologies.add("WebSocket");

  const languages: Record<string, number> = {};
  for (const file of files)
    if (file.language)
      languages[file.language] = (languages[file.language] ?? 0) + 1;
  const nodes: ProposedNode[] = [];
  const addNode = (key: string, node: Omit<ProposedNode, "id">) => {
    const id = idFor(key);
    nodes.push({ id, ...node });
    return id;
  };

  let frontend: string | undefined;
  let backend: string | undefined;
  let database: string | undefined;
  let cache: string | undefined;
  let queue: string | undefined;
  let worker: string | undefined;
  if (has("next") || has("react"))
    frontend = addNode("frontend", {
      type: "FRONTEND",
      label: has("next") ? "Web Application" : "Frontend",
      technology: has("next") ? "Next.js" : "React",
      description:
        "Detected from package metadata and frontend source structure.",
      x: 80,
      y: 100,
      metadata: {
        relatedFiles: related(files, /(^|\/)(app|pages|src\/app|src\/pages)\//),
      },
    });
  if (
    has("@nestjs/core") ||
    has("express") ||
    files.some((f) => /(^|\/)(api|server|backend)\//i.test(f.path))
  )
    backend = addNode("backend", {
      type: "BACKEND",
      label: "API",
      technology: has("@nestjs/core")
        ? "NestJS"
        : has("express")
          ? "Express"
          : "Node.js",
      description: "Detected server boundary.",
      x: 420,
      y: 100,
      metadata: {
        relatedFiles: related(
          files,
          /(^|\/)(api|server|backend|controllers?|routes?|services?)\//i,
        ),
      },
    });
  if (technologies.has("Prisma") || technologies.has("PostgreSQL"))
    database = addNode("database", {
      type: "DATABASE",
      label: "Primary Database",
      technology: technologies.has("PostgreSQL")
        ? "PostgreSQL"
        : "Database via Prisma",
      x: 760,
      y: 40,
      metadata: {
        relatedFiles: related(files, /(prisma|schema\.prisma|database|db)/i),
      },
    });
  if (technologies.has("Redis"))
    cache = addNode("redis", {
      type: "CACHE",
      label: "Redis",
      technology: "Redis",
      x: 760,
      y: 190,
      metadata: { relatedFiles: related(files, /redis|cache/i) },
    });
  if (technologies.has("BullMQ"))
    queue = addNode("queue", {
      type: "QUEUE",
      label: "Job Queue",
      technology: "BullMQ",
      x: 760,
      y: 330,
      metadata: { relatedFiles: related(files, /queue|bull|job/i) },
    });
  if (files.some((f) => /worker|processor|consumer/i.test(f.path)))
    worker = addNode("worker", {
      type: "SERVICE",
      label: "Worker",
      technology: "Node.js",
      x: 1080,
      y: 330,
      metadata: { relatedFiles: related(files, /worker|processor|consumer/i) },
    });

  const externalCandidates = [
    ["stripe", "Stripe"],
    ["resend", "Resend"],
    ["@sendgrid/mail", "SendGrid"],
    ["firebase", "Firebase"],
    ["@aws-sdk/client-s3", "Amazon S3"],
    ["openai", "OpenAI"],
  ] as const;
  let externalY = 480;
  for (const [dependency, label] of externalCandidates)
    if (has(dependency)) {
      addNode(`external:${label}`, {
        type: "EXTERNAL",
        label,
        technology: dependency,
        x: 760,
        y: externalY,
        metadata: { detectedDependency: dependency },
      });
      externalY += 130;
    }

  if (nodes.length === 0)
    addNode("repository", {
      type: "GENERIC",
      label: "Application",
      description:
        "Repository detected; framework boundaries need manual review.",
      x: 300,
      y: 180,
      metadata: { relatedFiles: files.slice(0, 30).map((f) => f.path) },
    });

  const edges: ProposedEdge[] = [];
  const connect = (
    source: string | undefined,
    target: string | undefined,
    type: ProposedEdge["type"],
    label?: string,
  ) => {
    if (source && target)
      edges.push({
        id: edgeId(source, target, type),
        sourceNodeId: source,
        targetNodeId: target,
        type,
        ...(label ? { label } : {}),
      });
  };
  connect(frontend, backend, "REST", "API requests");
  connect(backend, database, "SQL");
  connect(backend, cache, "INTERNAL", "cache");
  connect(backend, queue, "QUEUE", "jobs");
  connect(queue, worker, "QUEUE", "consume");
  connect(worker, database, "SQL");

  const inferences = [
    ...(frontend && backend
      ? [
          "A browser-to-API boundary is inferred from detected frontend and backend frameworks.",
        ]
      : []),
    ...(database
      ? [
          "A persistent data boundary is inferred from Prisma/PostgreSQL signals.",
        ]
      : []),
    ...(queue && worker
      ? [
          "Background processing is inferred from queue and worker file/package signals.",
        ]
      : []),
  ];
  return {
    facts: {
      languages,
      technologies: [...technologies],
      fileCount: files.length,
      importCount: files.reduce((sum, f) => sum + f.imports.length, 0),
    },
    inferences,
    proposal: { nodes, edges },
  };
}
