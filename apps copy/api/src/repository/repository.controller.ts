import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CurrentUser, SessionGuard } from "../auth/authenticated.js";
import type { AuthenticatedUser } from "../auth/authenticated.js";
import { AnalyzeRepositoryDto } from "./repository.dto.js";
import { RepositoryService } from "./repository.service.js";

@Controller({ path: "projects/:projectId/repository", version: "1" }) @UseGuards(SessionGuard)
export class RepositoryController {
  constructor(private readonly repository: RepositoryService) {}
  @Post("analyze") analyze(@CurrentUser() user: AuthenticatedUser, @Param("projectId") projectId: string, @Body() body: AnalyzeRepositoryDto) { return this.repository.analyze(user, projectId, body.repositoryUrl, body.branch); }
  @Get("analysis") latest(@CurrentUser() user: AuthenticatedUser, @Param("projectId") projectId: string) { return this.repository.latest(user.id, projectId); }
  @Post("generate") generate(@CurrentUser() user: AuthenticatedUser, @Param("projectId") projectId: string) { return this.repository.generate(user, projectId); }
}
