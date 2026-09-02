import assert from "node:assert/strict";
import test from "node:test";

import {
  EnvironmentValidationError,
  enumValue,
  integerValue,
  loadEnvironment,
  optional,
  stringValue,
  urlValue,
  withDefault,
} from "../dist/index.js";

const schema = {
  NODE_ENV: withDefault(enumValue(["development", "test", "production"]), "development"),
  API_PORT: withDefault(integerValue({ min: 1, max: 65_535 }), 3_001),
  PUBLIC_API_URL: urlValue({ protocols: ["http:", "https:"] }),
  RELEASE_SHA: optional(stringValue()),
};

test("parses, normalizes, defaults, and freezes environment values", () => {
  const config = loadEnvironment(schema, {
    PUBLIC_API_URL: " https://api.syncforge.example/v1 ",
  });

  assert.equal(config.NODE_ENV, "development");
  assert.equal(config.API_PORT, 3_001);
  assert.equal(config.PUBLIC_API_URL.href, "https://api.syncforge.example/v1");
  assert.equal(config.RELEASE_SHA, undefined);
  assert.equal(Object.isFrozen(config), true);
});

test("reports all invalid keys without exposing their values", () => {
  const secretValue = "not-a-url-with-secret-material";

  assert.throws(
    () =>
      loadEnvironment(schema, {
        NODE_ENV: "preview",
        API_PORT: "70000",
        PUBLIC_API_URL: secretValue,
      }),
    (error) => {
      assert.ok(error instanceof EnvironmentValidationError);
      assert.deepEqual(error.issues, [
        "NODE_ENV must be one of: development, test, production",
        "API_PORT must be at most 65535",
        "PUBLIC_API_URL must be a valid absolute URL",
      ]);
      assert.equal(error.message.includes(secretValue), false);
      return true;
    },
  );
});

test("fails clearly when a required value is missing", () => {
  assert.throws(
    () => loadEnvironment(schema, {}),
    /PUBLIC_API_URL is required/,
  );
});
