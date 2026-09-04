import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const schemaUrl = new URL("../prisma/schema.prisma", import.meta.url);
const migrationUrl = new URL(
  "../prisma/migrations/20260903000000_authentication_user/migration.sql",
  import.meta.url,
);

test("authentication user schema keeps the required storage boundaries", async () => {
  const [schema, migration] = await Promise.all([
    readFile(schemaUrl, "utf8"),
    readFile(migrationUrl, "utf8"),
  ]);

  assert.match(schema, /id\s+String\s+@id @default\(uuid\(\)\) @db\.Uuid/);
  assert.match(schema, /email\s+String\s+@unique @db\.VarChar\(254\)/);
  assert.match(
    schema,
    /passwordHash\s+String\s+@map\("password_hash"\) @db\.VarChar\(255\)/,
  );
  assert.match(schema, /@@map\("users"\)/);
  assert.match(migration, /CREATE TABLE "users"/);
  assert.match(migration, /"email" VARCHAR\(254\) NOT NULL/);
  assert.match(migration, /CREATE UNIQUE INDEX "users_email_key"/);
  assert.doesNotMatch(migration, /session|token|organization|role/i);
});
