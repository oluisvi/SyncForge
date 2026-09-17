import { Inject, Injectable } from "@nestjs/common";
import type { DatabaseClient } from "@syncforge/database";
import { DATABASE } from "../database/database.constants.js";
import { AccessService } from "../common/access.service.js";
import { ApiBadRequest, ApiNotFound } from "../common/http.js";
import { uniqueSlug } from "../common/slug.js";

@Injectable()
export class OrganizationsService {
  constructor(@Inject(DATABASE) private readonly db: DatabaseClient, private readonly access: AccessService) {}

  list(userId: string) {
    return this.db.membership.findMany({
      where: { userId },
      orderBy: { organization: { updatedAt: "desc" } },
      select: { role: true, organization: { select: { id: true, name: true, slug: true, createdAt: true, updatedAt: true, _count: { select: { projects: true, memberships: true } } } } },
    });
  }

  async create(userId: string, name: string) {
    return this.db.organization.create({
      data: { name: name.trim(), slug: uniqueSlug(name), memberships: { create: { userId, role: "OWNER" } } },
      select: { id: true, name: true, slug: true, createdAt: true, updatedAt: true },
    });
  }

  async members(userId: string, organizationId: string) {
    await this.access.organization(userId, organizationId);
    return this.db.membership.findMany({ where: { organizationId }, orderBy: { createdAt: "asc" }, select: { id: true, role: true, createdAt: true, user: { select: { id: true, email: true } } } });
  }

  async addMember(userId: string, organizationId: string, email: string, role: "ADMIN" | "MEMBER") {
    await this.access.organization(userId, organizationId, ["OWNER", "ADMIN"]);
    const target = await this.db.user.findUnique({ where: { email: email.trim().toLowerCase() }, select: { id: true } });
    if (!target) throw new ApiNotFound("USER_NOT_FOUND", "No SyncForge account exists for that email");
    try {
      return await this.db.membership.create({ data: { organizationId, userId: target.id, role }, select: { id: true, role: true, user: { select: { id: true, email: true } } } });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") throw new ApiBadRequest("MEMBER_EXISTS", "User is already a member");
      throw error;
    }
  }

  async updateRole(userId: string, organizationId: string, membershipId: string, role: "ADMIN" | "MEMBER") {
    await this.access.organization(userId, organizationId, ["OWNER"]);
    const target = await this.db.membership.findUnique({ where: { id: membershipId } });
    if (!target || target.organizationId !== organizationId) throw new ApiNotFound();
    if (target.role === "OWNER") throw new ApiBadRequest("OWNER_ROLE_LOCKED", "The owner role cannot be changed");
    return this.db.membership.update({ where: { id: membershipId }, data: { role }, select: { id: true, role: true } });
  }

  async removeMember(userId: string, organizationId: string, membershipId: string) {
    await this.access.organization(userId, organizationId, ["OWNER", "ADMIN"]);
    const target = await this.db.membership.findUnique({ where: { id: membershipId } });
    if (!target || target.organizationId !== organizationId) throw new ApiNotFound();
    if (target.role === "OWNER") throw new ApiBadRequest("OWNER_REQUIRED", "The organization owner cannot be removed");
    await this.db.membership.delete({ where: { id: membershipId } });
  }
}
