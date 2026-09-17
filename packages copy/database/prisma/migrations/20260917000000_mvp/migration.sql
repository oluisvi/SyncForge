CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
CREATE TYPE "ProjectVisibility" AS ENUM ('PRIVATE', 'ORGANIZATION', 'PUBLIC_READONLY');
CREATE TYPE "NodeType" AS ENUM ('FRONTEND', 'BACKEND', 'SERVICE', 'DATABASE', 'CACHE', 'QUEUE', 'INFRASTRUCTURE', 'EXTERNAL', 'GENERIC');
CREATE TYPE "EdgeType" AS ENUM ('HTTP', 'REST', 'GRAPHQL', 'WEBSOCKET', 'GRPC', 'SQL', 'EVENT', 'QUEUE', 'PUBSUB', 'WEBHOOK', 'FILE', 'INTERNAL');
CREATE TYPE "RepositoryAnalysisStatus" AS ENUM ('PENDING', 'COMPLETE', 'FAILED');

CREATE TABLE "users" (
  "id" UUID PRIMARY KEY,
  "email" VARCHAR(254) NOT NULL UNIQUE,
  "password_hash" VARCHAR(255) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "sessions" (
  "id" UUID PRIMARY KEY,
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash" CHAR(64) NOT NULL UNIQUE,
  "expires_at" TIMESTAMPTZ(3) NOT NULL,
  "last_seen_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revoked_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

CREATE TABLE "organizations" (
  "id" UUID PRIMARY KEY,
  "name" VARCHAR(120) NOT NULL,
  "slug" VARCHAR(140) NOT NULL UNIQUE,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "memberships" (
  "id" UUID PRIMARY KEY,
  "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" "MembershipRole" NOT NULL DEFAULT 'MEMBER',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "memberships_org_user_key" UNIQUE ("organization_id", "user_id")
);
CREATE INDEX "memberships_user_id_idx" ON "memberships"("user_id");

CREATE TABLE "projects" (
  "id" UUID PRIMARY KEY,
  "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "name" VARCHAR(120) NOT NULL,
  "slug" VARCHAR(140) NOT NULL,
  "description" VARCHAR(600),
  "repository_url" VARCHAR(500),
  "branch" VARCHAR(200) NOT NULL DEFAULT 'main',
  "visibility" "ProjectVisibility" NOT NULL DEFAULT 'PRIVATE',
  "archived_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "projects_org_slug_key" UNIQUE ("organization_id", "slug")
);
CREATE INDEX "projects_org_updated_idx" ON "projects"("organization_id", "updated_at");

CREATE TABLE "canvases" (
  "id" UUID PRIMARY KEY,
  "project_id" UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "name" VARCHAR(120) NOT NULL DEFAULT 'System Architecture',
  "version" INTEGER NOT NULL DEFAULT 0,
  "viewport" JSONB,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "canvases_project_updated_idx" ON "canvases"("project_id", "updated_at");

CREATE TABLE "architecture_nodes" (
  "id" VARCHAR(100) PRIMARY KEY,
  "canvas_id" UUID NOT NULL REFERENCES "canvases"("id") ON DELETE CASCADE,
  "type" "NodeType" NOT NULL,
  "label" VARCHAR(160) NOT NULL,
  "description" VARCHAR(800),
  "technology" VARCHAR(160),
  "x" DOUBLE PRECISION NOT NULL,
  "y" DOUBLE PRECISION NOT NULL,
  "width" DOUBLE PRECISION DEFAULT 240,
  "height" DOUBLE PRECISION DEFAULT 120,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "architecture_nodes_canvas_idx" ON "architecture_nodes"("canvas_id");
CREATE INDEX "architecture_nodes_canvas_label_idx" ON "architecture_nodes"("canvas_id", "label");

CREATE TABLE "architecture_edges" (
  "id" VARCHAR(100) PRIMARY KEY,
  "canvas_id" UUID NOT NULL REFERENCES "canvases"("id") ON DELETE CASCADE,
  "source_node_id" VARCHAR(100) NOT NULL REFERENCES "architecture_nodes"("id") ON DELETE CASCADE,
  "target_node_id" VARCHAR(100) NOT NULL REFERENCES "architecture_nodes"("id") ON DELETE CASCADE,
  "type" "EdgeType" NOT NULL DEFAULT 'INTERNAL',
  "label" VARCHAR(120),
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "architecture_edges_canvas_idx" ON "architecture_edges"("canvas_id");
CREATE INDEX "architecture_edges_source_idx" ON "architecture_edges"("source_node_id");
CREATE INDEX "architecture_edges_target_idx" ON "architecture_edges"("target_node_id");

CREATE TABLE "canvas_operations" (
  "id" UUID PRIMARY KEY,
  "op_id" VARCHAR(100) NOT NULL UNIQUE,
  "canvas_id" UUID NOT NULL REFERENCES "canvases"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "client_id" VARCHAR(100) NOT NULL,
  "version" INTEGER NOT NULL,
  "type" VARCHAR(60) NOT NULL,
  "payload" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "canvas_operations_canvas_version_idx" ON "canvas_operations"("canvas_id", "version");

CREATE TABLE "comments" (
  "id" UUID PRIMARY KEY,
  "canvas_id" UUID NOT NULL REFERENCES "canvases"("id") ON DELETE CASCADE,
  "node_id" VARCHAR(100) REFERENCES "architecture_nodes"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "body" VARCHAR(2000) NOT NULL,
  "resolved_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "comments_canvas_created_idx" ON "comments"("canvas_id", "created_at");
CREATE INDEX "comments_node_idx" ON "comments"("node_id");

CREATE TABLE "canvas_snapshots" (
  "id" UUID PRIMARY KEY,
  "canvas_id" UUID NOT NULL REFERENCES "canvases"("id") ON DELETE CASCADE,
  "version" INTEGER NOT NULL,
  "label" VARCHAR(160),
  "state" JSONB NOT NULL,
  "created_by_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "canvas_snapshots_canvas_created_idx" ON "canvas_snapshots"("canvas_id", "created_at");

CREATE TABLE "activities" (
  "id" UUID PRIMARY KEY,
  "project_id" UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "canvas_id" UUID REFERENCES "canvases"("id") ON DELETE CASCADE,
  "actor_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "type" VARCHAR(80) NOT NULL,
  "payload" JSONB,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "activities_project_created_idx" ON "activities"("project_id", "created_at");

CREATE TABLE "repository_analyses" (
  "id" UUID PRIMARY KEY,
  "project_id" UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "provider" VARCHAR(40) NOT NULL DEFAULT 'github',
  "owner" VARCHAR(160) NOT NULL,
  "repository" VARCHAR(160) NOT NULL,
  "branch" VARCHAR(200) NOT NULL,
  "status" "RepositoryAnalysisStatus" NOT NULL DEFAULT 'PENDING',
  "summary" JSONB,
  "error_code" VARCHAR(80),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "repository_analyses_project_created_idx" ON "repository_analyses"("project_id", "created_at");

CREATE TABLE "repository_files" (
  "id" UUID PRIMARY KEY,
  "analysis_id" UUID NOT NULL REFERENCES "repository_analyses"("id") ON DELETE CASCADE,
  "path" VARCHAR(1000) NOT NULL,
  "language" VARCHAR(60),
  "size" INTEGER NOT NULL,
  "imports" JSONB,
  CONSTRAINT "repository_files_analysis_path_key" UNIQUE ("analysis_id", "path")
);
CREATE INDEX "repository_files_analysis_idx" ON "repository_files"("analysis_id");
