import { Module } from "@nestjs/common";
import { AccessModule } from "./common/access.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { CanvasModule } from "./canvas/canvas.module.js";
import { DatabaseModule } from "./database/database.module.js";
import { HealthModule } from "./health/health.module.js";
import { OrganizationsModule } from "./organizations/organizations.module.js";
import { ProjectsModule } from "./projects/projects.module.js";
import { RepositoryModule } from "./repository/repository.module.js";
@Module({ imports: [DatabaseModule, AccessModule, AuthModule, OrganizationsModule, ProjectsModule, CanvasModule, RepositoryModule, HealthModule] })
export class AppModule {}
