import { Inject, Injectable } from "@nestjs/common";
import type { DatabaseClient } from "@syncforge/database";
import { DATABASE } from "../database/database.constants.js";
import { AccessService } from "../common/access.service.js";
import { ApiNotFound } from "../common/http.js";
import { uniqueSlug } from "../common/slug.js";
import type { CreateProjectDto, UpdateProjectDto } from "./projects.dto.js";

const projectSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  repositoryUrl: true,
  branch: true,
  visibility: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
  organizationId: true,
  canvases: {
    select: { id: true, name: true, version: true, updatedAt: true },
    orderBy: { createdAt: "asc" as const },
  },
} as const;

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(DATABASE) private readonly db: DatabaseClient,
    private readonly access: AccessService,
  ) {}

  async recent(userId: string) {
    const memberships = await this.db.membership.findMany({
      where: { userId },
      select: { organizationId: true },
    });
    return this.db.project.findMany({
      where: {
        organizationId: { in: memberships.map((item) => item.organizationId) },
        archivedAt: null,
      },
      orderBy: { updatedAt: "desc" },
      take: 40,
      select: projectSelect,
    });
  }

  async list(userId: string, organizationId: string) {
    await this.access.organization(userId, organizationId);
    return this.db.project.findMany({
      where: { organizationId, archivedAt: null },
      orderBy: { updatedAt: "desc" },
      select: projectSelect,
    });
  }

  async create(
    userId: string,
    organizationId: string,
    input: CreateProjectDto,
  ) {
    await this.access.organization(userId, organizationId);
    return this.db.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          organizationId,
          name: input.name.trim(),
          slug: uniqueSlug(input.name),
          description: input.description?.trim() ?? null,
          repositoryUrl: input.repositoryUrl ?? null,
          branch: input.branch?.trim() || "main",
          canvases: {
            create: {
              name: "System Architecture",
              viewport: { x: 0, y: 0, zoom: 1 },
            },
          },
        },
        select: projectSelect,
      });
      await tx.activity.create({
        data: {
          projectId: project.id,
          actorId: userId,
          type: "PROJECT_CREATED",
          payload: { name: project.name },
        },
      });
      return project;
    });
  }

  async get(userId: string, projectId: string) {
    await this.access.project(userId, projectId);
    const project = await this.db.project.findUnique({
      where: { id: projectId },
      select: projectSelect,
    });
    if (!project) throw new ApiNotFound();
    return project;
  }

  async update(userId: string, projectId: string, input: UpdateProjectDto) {
    await this.access.project(userId, projectId);
    return this.db.project.update({
      where: { id: projectId },
      data: {
        ...(input.name ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined
          ? { description: input.description.trim() || null }
          : {}),
        ...(input.repositoryUrl !== undefined
          ? { repositoryUrl: input.repositoryUrl }
          : {}),
        ...(input.branch !== undefined
          ? { branch: input.branch.trim() || "main" }
          : {}),
        ...(input.visibility ? { visibility: input.visibility } : {}),
      },
      select: projectSelect,
    });
  }

  async archive(userId: string, projectId: string) {
    await this.access.project(userId, projectId);
    await this.db.project.update({
      where: { id: projectId },
      data: { archivedAt: new Date() },
    });
    await this.db.activity.create({
      data: { projectId, actorId: userId, type: "PROJECT_ARCHIVED" },
    });
  }

  async activity(userId: string, projectId: string) {
    await this.access.project(userId, projectId);
    return this.db.activity.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        type: true,
        payload: true,
        createdAt: true,
        actor: { select: { id: true, email: true } },
      },
    });
  }
}
