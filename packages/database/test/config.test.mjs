import assert from "node:assert/strict";
import test from "node:test";

import { loadDatabaseConfig } from "../dist/index.js";

test("accepts PostgreSQL URLs and normalizes the connection string", () => {
  const config = loadDatabaseConfig({
    DATABASE_URL: " postgresql://user:password@localhost:5432/syncforge ",
  });

  assert.equal(config.connectionString, "postgresql://user:password@localhost:5432/syncforge");
  assert.equal(Object.isFrozen(config), true);
});

test("rejects missing and non-PostgreSQL database URLs", () => {
  assert.throws(() => loadDatabaseConfig({}), /DATABASE_URL is required/);
  assert.throws(
    () => loadDatabaseConfig({ DATABASE_URL: "https://database.example" }),
    /DATABASE_URL must use one of: postgres:, postgresql:/,
  );
});
