import { IsIn, IsObject, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export const operationTypes = ["UPSERT_NODE", "UPDATE_NODE", "MOVE_NODE", "REMOVE_NODE", "UPSERT_EDGE", "REMOVE_EDGE", "SET_VIEWPORT"] as const;
export type OperationType = (typeof operationTypes)[number];

export class CanvasOperationDto {
  @IsString() @MinLength(8) @MaxLength(100) opId!: string;
  @IsString() @MinLength(4) @MaxLength(100) clientId!: string;
  @IsIn(operationTypes) type!: OperationType;
  @IsObject() payload!: Record<string, unknown>;
}
export class CreateCommentDto {
  @IsOptional() @IsString() @MaxLength(100) nodeId?: string;
  @IsString() @MinLength(1) @MaxLength(2000) body!: string;
}
export class SnapshotDto { @IsOptional() @IsString() @MaxLength(160) label?: string; }
export class PresenceDto { @IsOptional() @IsString() @MaxLength(100) nodeId?: string; @IsOptional() @IsString() @MaxLength(80) action?: string; }
