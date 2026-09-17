import { Inject, Injectable } from "@nestjs/common";
import type { DatabaseClient } from "@syncforge/database";
import { DATABASE } from "../database/database.constants.js";
import { ApiForbidden, ApiNotFound } from "./http.js";

export type MembershipRoleName = "OWNER" | "ADMIN" | "MEMBER";

@Injectable()
export class AccessService {
  constructor(@Inject(DATABASE) private readonly db: DatabaseClient) {}

  async organization(userId: string, organizationId: string, allowed?: readonly MembershipRoleName[]) {
    const membership = await this.db.membership.findUnique({ where: { organizationId_userId: { organizationId, userId } } });
    if (!membership) throw new ApiNotFound();
    if (allowed && !allowed.includes(membership.role as MembershipRoleName)) throw new ApiForbidden();
    return membership;
  }

  async project(userId: string, projectId: string) {
    const project = await this.db.project.findUnique({ where: { id: projectId }, select: { id: true, organizationId: true, visibility: true, archivedAt: true } });
    if (!project) throw new ApiNotFound();
    const membership = await this.db.membership.findUnique({ where: { organizationId_userId: { organizationId: project.organizationId, userId } } });
    if (!membership) throw new ApiNotFound();
    return { project, membership };
  }

  async canvas(userId: string, canvasId: string) {
    const canvas = await this.db.canvas.findUnique({ where: { id: canvasId }, select: { id: true, projectId: true, project: { select: { organizationId: true } } } });
    if (!canvas) throw new ApiNotFound();
    const membership = await this.db.membership.findUnique({ where: { organizationId_userId: { organizationId: canvas.project.organizationId, userId } } });
    if (!membership) throw new ApiNotFound();
    return { canvas, membership };
  }
}
