import { Inject, Injectable } from "@nestjs/common";
import type { DatabaseClient } from "@syncforge/database";
import { DATABASE } from "../database/database.constants.js";
import { AccessService } from "../common/access.service.js";
import { ApiBadRequest, ApiNotFound } from "../common/http.js";
import type { AuthenticatedUser } from "../auth/authenticated.js";
import { loadApiConfig } from "../config/api.config.js";
import { CanvasService } from "../canvas/canvas.service.js";
import {
  extractImports,
  languageForPath,
  parseGitHubRepositoryUrl,
  shouldAnalyzePath,
  summarizeRepository,
} from "./analyzer.js";
import type { SourceFact, RepositorySummary } from "./analyzer.js";

type TreeItem = {
  path: string;
  type: "blob" | "tree";
  size?: number;
  sha?: string;
};
type TreeResponse = {
  tree?: TreeItem[];
  truncated?: boolean;
  message?: string;
};
type ContentResponse = {
  content?: string;
  encoding?: string;
  size?: number;
  message?: string;
};

@Injectable()
export class RepositoryService {
  private readonly config = loadApiConfig(process.env);
  constructor(
    @Inject(DATABASE) private readonly db: DatabaseClient,
    private readonly access: AccessService,
    private readonly canvas: CanvasService,
  ) {}

  private headers(): Record<string, string> {
    return {
      Accept: "application/vnd.github+json",
      "User-Agent": "SyncForge/1.0",
      ...(this.config.githubToken
        ? { Authorization: `Bearer ${this.config.githubToken}` }
        : {}),
    };
  }
  private async github<T>(url: string): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    try {
      const response = await fetch(url, {
        headers: this.headers(),
        signal: controller.signal,
      });
      if (!response.ok) {
        if (response.status === 404)
          throw new ApiNotFound(
            "REPOSITORY_NOT_FOUND",
            "Repository or branch not found",
          );
        if (response.status === 403 || response.status === 429)
          throw new ApiBadRequest(
            "GITHUB_RATE_LIMIT",
            "GitHub API limit reached; configure GITHUB_TOKEN for higher limits",
          );
        throw new ApiBadRequest(
          "GITHUB_REQUEST_FAILED",
          `GitHub returned HTTP ${response.status}`,
        );
      }
      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async readFile(
    owner: string,
    repository: string,
    branch: string,
    path: string,
    size: number,
  ): Promise<SourceFact | null> {
    if (!shouldAnalyzePath(path, size)) return null;
    const encodedPath = path.split("/").map(encodeURIComponent).join("/");
    const data = await this.github<ContentResponse>(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`,
    );
    if (data.encoding !== "base64" || !data.content) return null;
    const content = Buffer.from(
      data.content.replace(/\n/g, ""),
      "base64",
    ).toString("utf8");
    const language = languageForPath(path);
    return {
      path,
      size,
      ...(language ? { language } : {}),
      imports: extractImports(content),
      content,
    };
  }

  async analyze(
    user: AuthenticatedUser,
    projectId: string,
    repositoryUrl: string,
    branchInput?: string,
  ) {
    await this.access.project(user.id, projectId);
    let parsed: { owner: string; repository: string };
    try {
      parsed = parseGitHubRepositoryUrl(repositoryUrl);
    } catch (error) {
      throw new ApiBadRequest(
        "INVALID_REPOSITORY_URL",
        error instanceof Error ? error.message : "Invalid repository URL",
      );
    }
    const branch = branchInput?.trim() || "main";
    const analysis = await this.db.repositoryAnalysis.create({
      data: {
        projectId,
        owner: parsed.owner,
        repository: parsed.repository,
        branch,
        status: "PENDING",
      },
      select: { id: true },
    });
    try {
      const tree = await this.github<TreeResponse>(
        `https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repository)}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
      );
      if (!tree.tree)
        throw new ApiBadRequest(
          "EMPTY_REPOSITORY",
          "GitHub returned no repository tree",
        );
      const candidates = tree.tree
        .filter(
          (item) =>
            item.type === "blob" &&
            shouldAnalyzePath(item.path, item.size ?? 0),
        )
        .sort(
          (a, b) =>
            Number(b.path.endsWith("package.json")) -
              Number(a.path.endsWith("package.json")) ||
            a.path.localeCompare(b.path),
        )
        .slice(0, 80);
      const files: SourceFact[] = [];
      for (let index = 0; index < candidates.length; index += 8) {
        const batch = candidates.slice(index, index + 8);
        const loaded = await Promise.all(
          batch.map((item) =>
            this.readFile(
              parsed.owner,
              parsed.repository,
              branch,
              item.path,
              item.size ?? 0,
            ),
          ),
        );
        for (const file of loaded) if (file) files.push(file);
      }
      const summary = summarizeRepository(files);
      await this.db.$transaction(async (tx) => {
        if (files.length)
          await tx.repositoryFile.createMany({
            data: files.map((file) => ({
              analysisId: analysis.id,
              path: file.path,
              language: file.language ?? null,
              size: file.size,
              imports: file.imports as never,
            })),
          });
        await tx.repositoryAnalysis.update({
          where: { id: analysis.id },
          data: { status: "COMPLETE", summary: summary as never },
        });
        await tx.project.update({
          where: { id: projectId },
          data: { repositoryUrl, branch },
        });
        await tx.activity.create({
          data: {
            projectId,
            actorId: user.id,
            type: "REPOSITORY_ANALYZED",
            payload: {
              analysisId: analysis.id,
              fileCount: files.length,
              treeTruncated: Boolean(tree.truncated),
            },
          },
        });
      });
      return {
        id: analysis.id,
        status: "COMPLETE",
        treeTruncated: Boolean(tree.truncated),
        summary,
      };
    } catch (error) {
      await this.db.repositoryAnalysis
        .update({
          where: { id: analysis.id },
          data: {
            status: "FAILED",
            errorCode:
              error instanceof ApiBadRequest ? "ANALYSIS_FAILED" : "UNEXPECTED",
          },
        })
        .catch(() => undefined);
      throw error;
    }
  }

  async latest(userId: string, projectId: string) {
    await this.access.project(userId, projectId);
    return this.db.repositoryAnalysis.findFirst({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        owner: true,
        repository: true,
        branch: true,
        status: true,
        summary: true,
        errorCode: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async generate(user: AuthenticatedUser, projectId: string) {
    await this.access.project(user.id, projectId);
    const analysis = await this.db.repositoryAnalysis.findFirst({
      where: { projectId, status: "COMPLETE" },
      orderBy: { createdAt: "desc" },
      select: { id: true, summary: true },
    });
    if (!analysis?.summary)
      throw new ApiBadRequest(
        "ANALYSIS_REQUIRED",
        "Analyze a repository before generating architecture",
      );
    const project = await this.db.project.findUnique({
      where: { id: projectId },
      select: {
        canvases: {
          take: 1,
          orderBy: { createdAt: "asc" },
          select: { id: true },
        },
      },
    });
    const canvasId = project?.canvases[0]?.id;
    if (!canvasId)
      throw new ApiNotFound(
        "CANVAS_NOT_FOUND",
        "Project has no architecture canvas",
      );
    const summary = analysis.summary as unknown as RepositorySummary;
    const clientId = `analysis-${analysis.id}`;
    for (const node of summary.proposal.nodes) {
      await this.canvas.apply(user, canvasId, {
        opId: `${analysis.id}:node:${node.id}`,
        clientId,
        type: "UPSERT_NODE",
        payload: node as unknown as Record<string, unknown>,
      });
    }
    for (const edge of summary.proposal.edges) {
      await this.canvas.apply(user, canvasId, {
        opId: `${analysis.id}:edge:${edge.id}`,
        clientId,
        type: "UPSERT_EDGE",
        payload: edge as unknown as Record<string, unknown>,
      });
    }
    await this.db.activity.create({
      data: {
        projectId,
        canvasId,
        actorId: user.id,
        type: "ARCHITECTURE_GENERATED",
        payload: {
          analysisId: analysis.id,
          nodeCount: summary.proposal.nodes.length,
          edgeCount: summary.proposal.edges.length,
        },
      },
    });
    return {
      canvasId,
      nodeCount: summary.proposal.nodes.length,
      edgeCount: summary.proposal.edges.length,
    };
  }
}
