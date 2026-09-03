import assert from "node:assert/strict";
import test from "node:test";

import { loadApiConfig } from "../dist/config/api.config.js";

test("loads API defaults and normalizes the allowed origin", () => {
  const config = loadApiConfig({
    API_CORS_ORIGIN: "https://app.syncforge.test/",
  });

  assert.deepEqual(config, {
    nodeEnvironment: "development",
    port: 3_001,
    corsOrigin: "https://app.syncforge.test",
  });
  assert.equal(Object.isFrozen(config), true);
});

test("loads explicit API configuration", () => {
  assert.deepEqual(
    loadApiConfig({
      NODE_ENV: "production",
      API_PORT: "8080",
      API_CORS_ORIGIN: "http://localhost:3000",
    }),
    {
      nodeEnvironment: "production",
      port: 8_080,
      corsOrigin: "http://localhost:3000",
    },
  );
});

test("rejects missing, out-of-range, and non-origin API values without leaking them", () => {
  const suppliedOrigin = "https://user:secret@example.test/private?token=sensitive";

  assert.throws(
    () =>
      loadApiConfig({
        NODE_ENV: "preview",
        API_PORT: "65536",
        API_CORS_ORIGIN: suppliedOrigin,
      }),
    (error) => {
      assert.match(error.message, /NODE_ENV/);
      assert.match(error.message, /API_PORT/);
      assert.match(error.message, /API_CORS_ORIGIN/);
      assert.doesNotMatch(error.message, /preview/);
      assert.doesNotMatch(error.message, /secret|sensitive/);
      return true;
    },
  );

  assert.throws(
    () => loadApiConfig({}),
    /API_CORS_ORIGIN is required/,
  );
});
