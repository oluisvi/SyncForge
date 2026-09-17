import assert from "node:assert/strict";
import test from "node:test";
import {
  booleanValue,
  integerValue,
  loadEnvironment,
  optional,
  stringValue,
  withDefault,
} from "../dist/index.js";

test("loads defaults, booleans and optional values without exposing supplied values", () => {
  const result = loadEnvironment(
    {
      NAME: stringValue(),
      PORT: withDefault(integerValue({ min: 1 }), 3000),
      FLAG: booleanValue(),
      TOKEN: optional(stringValue()),
    },
    { NAME: "SyncForge", FLAG: "true" },
  );
  assert.equal(result.NAME, "SyncForge");
  assert.equal(result.PORT, 3000);
  assert.equal(result.FLAG, true);
  assert.equal(result.TOKEN, undefined);
});
