import assert from "node:assert/strict";
import test from "node:test";
import { extractImports, parseGitHubRepositoryUrl, shouldAnalyzePath, summarizeRepository } from "../dist/repository/analyzer.js";

test("GitHub URL parsing rejects non-GitHub hosts", () => {
  assert.deepEqual(parseGitHubRepositoryUrl("https://github.com/openai/example"), { owner: "openai", repository: "example" });
  assert.throws(() => parseGitHubRepositoryUrl("https://example.com/openai/example"));
});

test("analysis excludes secrets, generated content and oversized files", () => {
  assert.equal(shouldAnalyzePath("src/index.ts", 100), true);
  assert.equal(shouldAnalyzePath(".env", 10), false);
  assert.equal(shouldAnalyzePath("node_modules/x/index.js", 100), false);
  assert.equal(shouldAnalyzePath("src/huge.ts", 200 * 1024), false);
});

test("extracts static imports without executing source", () => {
  const source = `import x from "./x"; export { y } from "./y"; const z = require("zod"); import("./lazy");`;
  assert.deepEqual(extractImports(source).sort(), ["./lazy", "./x", "./y", "zod"]);
});

test("repository facts generate high-level architecture", () => {
  const summary = summarizeRepository([
    { path: "package.json", size: 100, language: "JSON", imports: [], content: JSON.stringify({ dependencies: { next: "1", react: "1", "@nestjs/core": "1", "@prisma/client": "1", pg: "1" } }) },
    { path: "apps/web/src/app/page.tsx", size: 100, language: "TypeScript", imports: ["react"] },
    { path: "apps/api/src/main.ts", size: 100, language: "TypeScript", imports: ["@nestjs/core"] },
    { path: "prisma/schema.prisma", size: 100, language: "Prisma", imports: [] },
  ]);
  assert.ok(summary.facts.technologies.includes("Next.js"));
  assert.ok(summary.proposal.nodes.some((node) => node.type === "FRONTEND"));
  assert.ok(summary.proposal.nodes.some((node) => node.type === "BACKEND"));
  assert.ok(summary.proposal.nodes.some((node) => node.type === "DATABASE"));
});
