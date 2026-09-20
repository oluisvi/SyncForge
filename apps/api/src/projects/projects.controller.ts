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
import { CreateProjectDto, UpdateProjectDto } from "./projects.dto.js";
import { ProjectsService } from "./projects.service.js";

@Controller({ version: "1" })
@UseGuards(SessionGuard)
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}
  @Get("projects") recent(@CurrentUser() user: AuthenticatedUser) {
    return this.projects.recent(user.id);
  }
  @Get("organizations/:organizationId/projects") list(
    @CurrentUser() user: AuthenticatedUser,
    @Param("organizationId") organizationId: string,
  ) {
    return this.projects.list(user.id, organizationId);
  }
  @Post("organizations/:organizationId/projects") create(
    @CurrentUser() user: AuthenticatedUser,
    @Param("organizationId") organizationId: string,
    @Body() body: CreateProjectDto,
  ) {
    return this.projects.create(user.id, organizationId, body);
  }
  @Get("projects/:projectId") get(
    @CurrentUser() user: AuthenticatedUser,
    @Param("projectId") projectId: string,
  ) {
    return this.projects.get(user.id, projectId);
  }
  @Patch("projects/:projectId") update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("projectId") projectId: string,
    @Body() body: UpdateProjectDto,
  ) {
    return this.projects.update(user.id, projectId, body);
  }
  @Delete("projects/:projectId") @HttpCode(HttpStatus.NO_CONTENT) archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param("projectId") projectId: string,
  ) {
    return this.projects.archive(user.id, projectId);
  }
  @Get("projects/:projectId/activity") activity(
    @CurrentUser() user: AuthenticatedUser,
    @Param("projectId") projectId: string,
  ) {
    return this.projects.activity(user.id, projectId);
  }
}
