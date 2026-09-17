import { Inject, Injectable } from "@nestjs/common";
import type { DatabaseClient } from "@syncforge/database";
import { DATABASE } from "../database/database.constants.js";
import { AccessService } from "../common/access.service.js";
import { ApiBadRequest, ApiNotFound } from "../common/http.js";
import type { AuthenticatedUser } from "../auth/authenticated.js";
import type { CanvasOperationDto, OperationType } from "./canvas.dto.js";
import { RealtimeService } from "./realtime.service.js";

const nodeTypes = new Set([
  "FRONTEND",
  "BACKEND",
  "SERVICE",
  "DATABASE",
  "CACHE",
  "QUEUE",
  "INFRASTRUCTURE",
  "EXTERNAL",
  "GENERIC",
]);
const edgeTypes = new Set([
  "HTTP",
  "REST",
  "GRAPHQL",
  "WEBSOCKET",
  "GRPC",
  "SQL",
  "EVENT",
  "QUEUE",
  "PUBSUB",
  "WEBHOOK",
  "FILE",
  "INTERNAL",
]);

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new ApiBadRequest(
      "INVALID_OPERATION",
      "Operation payload must be an object",
    );
  return value as Record<string, unknown>;
}
function text(value: unknown, key: string, max = 200): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.length > max
  )
    throw new ApiBadRequest("INVALID_OPERATION", `${key} is invalid`);
  return value.trim();
}
function numberValue(value: unknown, key: string): number {
  if (typeof value !== "number" || !Number.isFinite(value))
    throw new ApiBadRequest(
      "INVALID_OPERATION",
      `${key} must be a finite number`,
    );
  return value;
}
function optionalText(value: unknown, max: number): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string" || value.length > max)
    throw new ApiBadRequest("INVALID_OPERATION", "Text field is invalid");
  return value.trim();
}

@Injectable()
export class CanvasService {
  constructor(
    @Inject(DATABASE) private readonly db: DatabaseClient,
    private readonly access: AccessService,
    private readonly realtime: RealtimeService,
  ) {}

  async get(userId: string, canvasId: string) {
    await this.access.canvas(userId, canvasId);
    const canvas = await this.db.canvas.findUnique({
      where: { id: canvasId },
      select: {
        id: true,
        name: true,
        version: true,
        viewport: true,
        updatedAt: true,
        projectId: true,
        nodes: { orderBy: { createdAt: "asc" } },
        edges: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!canvas) throw new ApiNotFound();
    return { ...canvas, presence: this.realtime.currentPresence(canvasId) };
  }

  async operationsSince(userId: string, canvasId: string, after: number) {
    await this.access.canvas(userId, canvasId);
    return this.db.canvasOperation.findMany({
      where: { canvasId, version: { gt: Math.max(0, after) } },
      orderBy: { version: "asc" },
      take: 500,
      select: {
        opId: true,
        clientId: true,
        version: true,
        type: true,
        payload: true,
        createdAt: true,
        user: { select: { id: true, email: true } },
      },
    });
  }

  async apply(
    user: AuthenticatedUser,
    canvasId: string,
    operation: CanvasOperationDto,
  ) {
    await this.access.canvas(user.id, canvasId);
    try {
      const result = await this.db.$transaction(async (tx) => {
        const existing = await tx.canvasOperation.findUnique({
          where: { opId: operation.opId },
          select: { version: true, type: true, payload: true },
        });
        if (existing)
          return {
            duplicate: true as const,
            version: existing.version,
            operation: existing,
          };

        const pending = await tx.canvasOperation.create({
          data: {
            opId: operation.opId,
            canvasId,
            userId: user.id,
            clientId: operation.clientId,
            version: 0,
            type: operation.type,
            payload: operation.payload as never,
          },
          select: { id: true },
        });
        await this.applyPayload(
          tx as unknown as DatabaseClient,
          canvasId,
          operation.type,
          operation.payload,
        );
        const updated = await tx.canvas.update({
          where: { id: canvasId },
          data: { version: { increment: 1 } },
          select: { version: true, projectId: true },
        });
        await tx.canvasOperation.update({
          where: { id: pending.id },
          data: { version: updated.version },
        });
        if (
          ["UPSERT_NODE", "REMOVE_NODE", "UPSERT_EDGE", "REMOVE_EDGE"].includes(
            operation.type,
          )
        ) {
          await tx.activity.create({
            data: {
              projectId: updated.projectId,
              canvasId,
              actorId: user.id,
              type: `CANVAS_${operation.type}`,
              payload: { opId: operation.opId },
            },
          });
        }
        return {
          duplicate: false as const,
          version: updated.version,
          operation: {
            opId: operation.opId,
            clientId: operation.clientId,
            type: operation.type,
            payload: operation.payload,
            user,
          },
        };
      });
      if (!result.duplicate) {
        this.realtime.publish(canvasId, "operation", {
          ...result.operation,
          version: result.version,
        });
        if (result.version % 25 === 0)
          void this.createSnapshot(
            user.id,
            canvasId,
            `Auto snapshot v${result.version}`,
          ).catch(() => undefined);
      }
      return result;
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        const existing = await this.db.canvasOperation.findUnique({
          where: { opId: operation.opId },
          select: { version: true, type: true, payload: true },
        });
        if (existing)
          return {
            duplicate: true as const,
            version: existing.version,
            operation: existing,
          };
      }
      throw error;
    }
  }

  private async applyPayload(
    db: DatabaseClient,
    canvasId: string,
    type: OperationType,
    raw: Record<string, unknown>,
  ): Promise<void> {
    const payload = record(raw);
    if (type === "UPSERT_NODE") {
      const id = text(payload.id, "id", 100);
      const label = text(payload.label, "label", 160);
      const nodeType = text(payload.type, "type", 30);
      if (!nodeTypes.has(nodeType))
        throw new ApiBadRequest("INVALID_NODE_TYPE", "Unsupported node type");
      const x = numberValue(payload.x, "x");
      const y = numberValue(payload.y, "y");
      const description = optionalText(payload.description, 800);
      const technology = optionalText(payload.technology, 160);
      await db.architectureNode.upsert({
        where: { id },
        create: {
          id,
          canvasId,
          label,
          type: nodeType as never,
          x,
          y,
          description,
          technology,
          metadata: record(payload.metadata ?? {}) as never,
        },
        update: {
          label,
          type: nodeType as never,
          x,
          y,
          description,
          technology,
          metadata: record(payload.metadata ?? {}) as never,
        },
      });
      return;
    }
    if (type === "UPDATE_NODE") {
      const id = text(payload.id, "id", 100);
      const data: Record<string, unknown> = {};
      if (payload.label !== undefined)
        data.label = text(payload.label, "label", 160);
      if (payload.description !== undefined)
        data.description = optionalText(payload.description, 800);
      if (payload.technology !== undefined)
        data.technology = optionalText(payload.technology, 160);
      if (payload.type !== undefined) {
        const nodeType = text(payload.type, "type", 30);
        if (!nodeTypes.has(nodeType))
          throw new ApiBadRequest("INVALID_NODE_TYPE", "Unsupported node type");
        data.type = nodeType;
      }
      if (payload.metadata !== undefined)
        data.metadata = record(payload.metadata);
      const updated = await db.architectureNode.updateMany({
        where: { id, canvasId },
        data: data as never,
      });
      if (updated.count === 0)
        throw new ApiNotFound("NODE_NOT_FOUND", "Node not found");
      return;
    }
    if (type === "MOVE_NODE") {
      const id = text(payload.id, "id", 100);
      const updated = await db.architectureNode.updateMany({
        where: { id, canvasId },
        data: {
          x: numberValue(payload.x, "x"),
          y: numberValue(payload.y, "y"),
        },
      });
      if (updated.count === 0)
        throw new ApiNotFound("NODE_NOT_FOUND", "Node not found");
      return;
    }
    if (type === "REMOVE_NODE") {
      await db.architectureNode.deleteMany({
        where: { id: text(payload.id, "id", 100), canvasId },
      });
      return;
    }
    if (type === "UPSERT_EDGE") {
      const id = text(payload.id, "id", 100);
      const sourceNodeId = text(payload.sourceNodeId, "sourceNodeId", 100);
      const targetNodeId = text(payload.targetNodeId, "targetNodeId", 100);
      if (sourceNodeId === targetNodeId)
        throw new ApiBadRequest(
          "INVALID_EDGE",
          "An edge cannot connect a node to itself",
        );
      const count = await db.architectureNode.count({
        where: { canvasId, id: { in: [sourceNodeId, targetNodeId] } },
      });
      if (count !== 2)
        throw new ApiBadRequest(
          "INVALID_EDGE",
          "Both edge endpoints must belong to the canvas",
        );
      const edgeType =
        payload.type === undefined
          ? "INTERNAL"
          : text(payload.type, "type", 30);
      if (!edgeTypes.has(edgeType))
        throw new ApiBadRequest("INVALID_EDGE_TYPE", "Unsupported edge type");
      const label = optionalText(payload.label, 120);
      await db.architectureEdge.upsert({
        where: { id },
        create: {
          id,
          canvasId,
          sourceNodeId,
          targetNodeId,
          type: edgeType as never,
          label,
        },
        update: { sourceNodeId, targetNodeId, type: edgeType as never, label },
      });
      return;
    }
    if (type === "REMOVE_EDGE") {
      await db.architectureEdge.deleteMany({
        where: { id: text(payload.id, "id", 100), canvasId },
      });
      return;
    }
    if (type === "SET_VIEWPORT") {
      const x = numberValue(payload.x, "x");
      const y = numberValue(payload.y, "y");
      const zoom = numberValue(payload.zoom, "zoom");
      if (zoom < 0.15 || zoom > 3)
        throw new ApiBadRequest(
          "INVALID_VIEWPORT",
          "Zoom must be between 0.15 and 3",
        );
      await db.canvas.update({
        where: { id: canvasId },
        data: { viewport: { x, y, zoom } },
      });
    }
  }

  async comments(userId: string, canvasId: string) {
    await this.access.canvas(userId, canvasId);
    return this.db.comment.findMany({
      where: { canvasId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        nodeId: true,
        body: true,
        resolvedAt: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, email: true } },
      },
    });
  }
  async addComment(
    user: AuthenticatedUser,
    canvasId: string,
    nodeId: string | undefined,
    body: string,
  ) {
    await this.access.canvas(user.id, canvasId);
    if (nodeId) {
      const count = await this.db.architectureNode.count({
        where: { id: nodeId, canvasId },
      });
      if (!count) throw new ApiNotFound("NODE_NOT_FOUND", "Node not found");
    }
    const comment = await this.db.comment.create({
      data: { canvasId, nodeId, userId: user.id, body: body.trim() },
      select: {
        id: true,
        nodeId: true,
        body: true,
        resolvedAt: true,
        createdAt: true,
        user: { select: { id: true, email: true } },
      },
    });
    this.realtime.publish(canvasId, "comment", comment);
    return comment;
  }
  async resolveComment(userId: string, canvasId: string, commentId: string) {
    await this.access.canvas(userId, canvasId);
    const updated = await this.db.comment.updateMany({
      where: { id: commentId, canvasId },
      data: { resolvedAt: new Date() },
    });
    if (!updated.count) throw new ApiNotFound();
    this.realtime.publish(canvasId, "comment-resolved", { id: commentId });
  }

  async createSnapshot(userId: string, canvasId: string, label?: string) {
    await this.access.canvas(userId, canvasId);
    const state = await this.get(userId, canvasId);
    const snapshot = await this.db.canvasSnapshot.create({
      data: {
        canvasId,
        version: state.version,
        label: label?.trim(),
        state: {
          viewport: state.viewport,
          nodes: state.nodes,
          edges: state.edges,
        } as never,
        createdById: userId,
      },
      select: { id: true, version: true, label: true, createdAt: true },
    });
    return snapshot;
  }
  async snapshots(userId: string, canvasId: string) {
    await this.access.canvas(userId, canvasId);
    return this.db.canvasSnapshot.findMany({
      where: { canvasId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        version: true,
        label: true,
        createdAt: true,
        createdBy: { select: { id: true, email: true } },
      },
    });
  }
  async snapshot(userId: string, canvasId: string, snapshotId: string) {
    await this.access.canvas(userId, canvasId);
    const item = await this.db.canvasSnapshot.findFirst({
      where: { id: snapshotId, canvasId },
      select: {
        id: true,
        version: true,
        label: true,
        state: true,
        createdAt: true,
      },
    });
    if (!item) throw new ApiNotFound();
    return item;
  }

  async search(userId: string, canvasId: string, query: string) {
    const { canvas } = await this.access.canvas(userId, canvasId);
    const q = query.trim().slice(0, 100);
    if (q.length < 2) return { nodes: [], comments: [], files: [] };
    const [nodes, comments, files] = await Promise.all([
      this.db.architectureNode.findMany({
        where: {
          canvasId,
          OR: [
            { label: { contains: q, mode: "insensitive" } },
            { technology: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 20,
        select: { id: true, label: true, type: true, technology: true },
      }),
      this.db.comment.findMany({
        where: { canvasId, body: { contains: q, mode: "insensitive" } },
        take: 20,
        select: { id: true, nodeId: true, body: true },
      }),
      this.db.repositoryFile.findMany({
        where: {
          analysis: { projectId: canvas.projectId, status: "COMPLETE" },
          path: { contains: q, mode: "insensitive" },
        },
        take: 20,
        select: { id: true, path: true, language: true },
      }),
    ]);
    return { nodes, comments, files };
  }
}
