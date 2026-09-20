import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser, SessionGuard } from "../auth/authenticated.js";
import type { AuthenticatedUser } from "../auth/authenticated.js";
import {
  AddMemberDto,
  CreateOrganizationDto,
  UpdateMemberRoleDto,
} from "./organizations.dto.js";
import { OrganizationsService } from "./organizations.service.js";

@Controller({ path: "organizations", version: "1" })
@UseGuards(SessionGuard)
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}
  @Get() list(@CurrentUser() user: AuthenticatedUser) {
    return this.organizations.list(user.id);
  }
  @Post() create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateOrganizationDto,
  ) {
    return this.organizations.create(user.id, body.name);
  }
  @Get(":organizationId/members") members(
    @CurrentUser() user: AuthenticatedUser,
    @Param("organizationId") organizationId: string,
  ) {
    return this.organizations.members(user.id, organizationId);
  }
  @Post(":organizationId/members") add(
    @CurrentUser() user: AuthenticatedUser,
    @Param("organizationId") organizationId: string,
    @Body() body: AddMemberDto,
  ) {
    return this.organizations.addMember(
      user.id,
      organizationId,
      body.email,
      body.role ?? "MEMBER",
    );
  }
  @Patch(":organizationId/members/:membershipId") update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("organizationId") organizationId: string,
    @Param("membershipId") membershipId: string,
    @Body() body: UpdateMemberRoleDto,
  ) {
    return this.organizations.updateRole(
      user.id,
      organizationId,
      membershipId,
      body.role,
    );
  }
  @Delete(":organizationId/members/:membershipId")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param("organizationId") organizationId: string,
    @Param("membershipId") membershipId: string,
  ) {
    return this.organizations.removeMember(
      user.id,
      organizationId,
      membershipId,
    );
  }
}
