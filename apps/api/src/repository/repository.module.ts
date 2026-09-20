import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { CanvasModule } from "../canvas/canvas.module.js";
import { RepositoryController } from "./repository.controller.js";
import { RepositoryService } from "./repository.service.js";
@Module({
  imports: [AuthModule, CanvasModule],
  controllers: [RepositoryController],
  providers: [RepositoryService],
})
export class RepositoryModule {}
