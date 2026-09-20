import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Sse,
  UseGuards,
} from "@nestjs/common";
import type { MessageEvent } from "@nestjs/common";
import type { Observable } from "rxjs";
import { CurrentUser, SessionGuard } from "../auth/authenticated.js";
import type { AuthenticatedUser } from "../auth/authenticated.js";
import {
  CanvasOperationDto,
  CreateCommentDto,
  PresenceDto,
  SnapshotDto,
} from "./canvas.dto.js";
import { CanvasService } from "./canvas.service.js";
import { RealtimeService } from "./realtime.service.js";
import { AccessService } from "../common/access.service.js";

@Controller({ path: "canvases", version: "1" })
@UseGuards(SessionGuard)
export class CanvasController {
  constructor(
    private readonly canvas: CanvasService,
    private readonly realtime: RealtimeService,
    private readonly access: AccessService,
  ) {}
  @Get(":canvasId") get(
    @CurrentUser() user: AuthenticatedUser,
    @Param("canvasId") canvasId: string,
  ) {
    return this.canvas.get(user.id, canvasId);
  }
  @Get(":canvasId/operations") operations(
    @CurrentUser() user: AuthenticatedUser,
    @Param("canvasId") canvasId: string,
    @Query("after") after?: string,
  ) {
    const version = Number(after ?? 0);
    return this.canvas.operationsSince(
      user.id,
      canvasId,
      Number.isSafeInteger(version) && version >= 0 ? version : 0,
    );
  }
  @Post(":canvasId/operations") apply(
    @CurrentUser() user: AuthenticatedUser,
    @Param("canvasId") canvasId: string,
    @Body() body: CanvasOperationDto,
  ) {
    return this.canvas.apply(user, canvasId, body);
  }
  @Get(":canvasId/comments") comments(
    @CurrentUser() user: AuthenticatedUser,
    @Param("canvasId") canvasId: string,
  ) {
    return this.canvas.comments(user.id, canvasId);
  }
  @Post(":canvasId/comments") addComment(
    @CurrentUser() user: AuthenticatedUser,
    @Param("canvasId") canvasId: string,
    @Body() body: CreateCommentDto,
  ) {
    return this.canvas.addComment(user, canvasId, body.nodeId, body.body);
  }
  @Patch(":canvasId/comments/:commentId/resolve")
  @HttpCode(HttpStatus.NO_CONTENT)
  resolve(
    @CurrentUser() user: AuthenticatedUser,
    @Param("canvasId") canvasId: string,
    @Param("commentId") commentId: string,
  ) {
    return this.canvas.resolveComment(user.id, canvasId, commentId);
  }
  @Get(":canvasId/history") history(
    @CurrentUser() user: AuthenticatedUser,
    @Param("canvasId") canvasId: string,
  ) {
    return this.canvas.snapshots(user.id, canvasId);
  }
  @Post(":canvasId/history") snapshot(
    @CurrentUser() user: AuthenticatedUser,
    @Param("canvasId") canvasId: string,
    @Body() body: SnapshotDto,
  ) {
    return this.canvas.createSnapshot(user.id, canvasId, body.label);
  }
  @Get(":canvasId/history/:snapshotId") snapshotDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param("canvasId") canvasId: string,
    @Param("snapshotId") snapshotId: string,
  ) {
    return this.canvas.snapshot(user.id, canvasId, snapshotId);
  }
  @Get(":canvasId/search") search(
    @CurrentUser() user: AuthenticatedUser,
    @Param("canvasId") canvasId: string,
    @Query("q") q = "",
  ) {
    return this.canvas.search(user.id, canvasId, q);
  }
  @Post(":canvasId/presence") async heartbeat(
    @CurrentUser() user: AuthenticatedUser,
    @Param("canvasId") canvasId: string,
    @Body() body: PresenceDto,
  ) {
    await this.access.canvas(user.id, canvasId);
    return this.realtime.heartbeat(canvasId, {
      userId: user.id,
      email: user.email,
      ...(body.nodeId ? { nodeId: body.nodeId } : {}),
      ...(body.action ? { action: body.action } : {}),
    });
  }
  @Sse(":canvasId/events") async events(
    @CurrentUser() user: AuthenticatedUser,
    @Param("canvasId") canvasId: string,
  ): Promise<Observable<MessageEvent>> {
    await this.access.canvas(user.id, canvasId);
    return this.realtime.subscribe(canvasId);
  }
}
