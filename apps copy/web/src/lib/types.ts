export type User = { id: string; email: string };
export type Organization = { id: string; name: string; slug: string; createdAt: string; updatedAt: string; _count?: { projects: number; memberships: number } };
export type OrganizationMembership = { role: "OWNER" | "ADMIN" | "MEMBER"; organization: Organization };
export type Project = {
  id: string; organizationId: string; name: string; slug: string; description: string | null; repositoryUrl: string | null; branch: string;
  visibility: "PRIVATE" | "ORGANIZATION" | "PUBLIC_READONLY"; archivedAt: string | null; createdAt: string; updatedAt: string;
  canvases: Array<{ id: string; name: string; version: number; updatedAt: string }>;
};
export type NodeType = "FRONTEND" | "BACKEND" | "SERVICE" | "DATABASE" | "CACHE" | "QUEUE" | "INFRASTRUCTURE" | "EXTERNAL" | "GENERIC";
export type EdgeType = "HTTP" | "REST" | "GRAPHQL" | "WEBSOCKET" | "GRPC" | "SQL" | "EVENT" | "QUEUE" | "PUBSUB" | "WEBHOOK" | "FILE" | "INTERNAL";
export type ArchitectureNode = { id: string; canvasId: string; type: NodeType; label: string; description: string | null; technology: string | null; x: number; y: number; width: number | null; height: number | null; metadata: Record<string, unknown> | null; createdAt: string; updatedAt: string };
export type ArchitectureEdge = { id: string; canvasId: string; sourceNodeId: string; targetNodeId: string; type: EdgeType; label: string | null; metadata: Record<string, unknown> | null; createdAt: string; updatedAt: string };
export type Presence = { userId: string; email: string; nodeId?: string; action?: string; lastSeenAt: number };
export type CanvasState = { id: string; projectId: string; name: string; version: number; viewport: { x: number; y: number; zoom: number } | null; updatedAt: string; nodes: ArchitectureNode[]; edges: ArchitectureEdge[]; presence: Presence[] };
export type Comment = { id: string; nodeId: string | null; body: string; resolvedAt: string | null; createdAt: string; updatedAt?: string; user: User };
export type Snapshot = { id: string; version: number; label: string | null; createdAt: string; createdBy?: User | null };
export type RepositorySummary = {
  facts: { languages: Record<string, number>; technologies: string[]; fileCount: number; importCount: number };
  inferences: string[];
  proposal: { nodes: Array<{ id: string; type: NodeType; label: string; technology?: string }>; edges: Array<{ id: string; sourceNodeId: string; targetNodeId: string; type: EdgeType }> };
};
export type RepositoryAnalysis = { id: string; owner: string; repository: string; branch: string; status: "PENDING" | "COMPLETE" | "FAILED"; summary: RepositorySummary | null; errorCode: string | null; createdAt: string; updatedAt: string };
