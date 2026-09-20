import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { CanvasController } from "./canvas.controller.js";
import { CanvasService } from "./canvas.service.js";
import { RealtimeService } from "./realtime.service.js";
@Module({
  imports: [AuthModule],
  controllers: [CanvasController],
  providers: [CanvasService, RealtimeService],
  exports: [CanvasService, RealtimeService],
})
export class CanvasModule {}
