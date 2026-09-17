import assert from "node:assert/strict";
import test from "node:test";
import { loadDatabaseConfig } from "../dist/index.js";

test("accepts a PostgreSQL connection URL", () => {
  const config = loadDatabaseConfig({ DATABASE_URL: "postgresql://user:pass@localhost:5432/syncforge" });
  assert.match(config.connectionString, /^postgresql:/);
});
