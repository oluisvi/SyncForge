import { Module } from "@nestjs/common";
import { CanvasController } from "./canvas.controller.js";
import { CanvasService } from "./canvas.service.js";
import { RealtimeService } from "./realtime.service.js";
@Module({
  controllers: [CanvasController],
  providers: [CanvasService, RealtimeService],
  exports: [CanvasService, RealtimeService],
})
export class CanvasModule {}
