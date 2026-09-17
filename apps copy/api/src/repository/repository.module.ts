import { Module } from "@nestjs/common";
import { CanvasModule } from "../canvas/canvas.module.js";
import { RepositoryController } from "./repository.controller.js";
import { RepositoryService } from "./repository.service.js";
@Module({
  imports: [CanvasModule],
  controllers: [RepositoryController],
  providers: [RepositoryService],
})
export class RepositoryModule {}
