import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { Body, Controller, Post } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { IsString } from "class-validator";
import request from "supertest";

import { AppModule } from "../dist/app.module.js";
import {
  configureApplication,
  startApplication,
} from "../dist/application.js";
import { DatabaseService } from "../dist/database/database.service.js";

class ValidationProbeDto {}
IsString()(ValidationProbeDto.prototype, "name");

class ValidationProbeController {
  create(body) {
    return body;
  }
}

const createDescriptor = Object.getOwnPropertyDescriptor(
  ValidationProbeController.prototype,
  "create",
);
Controller({ path: "validation-probe", version: "1" })(
  ValidationProbeController,
);
Post()(ValidationProbeController.prototype, "create", createDescriptor);
Body()(ValidationProbeController.prototype, "create", 0);
Reflect.defineMetadata(
  "design:paramtypes",
  [ValidationProbeDto],
  ValidationProbeController.prototype,
  "create",
);

const apiConfig = Object.freeze({
  nodeEnvironment: "test",
  port: 3_001,
  corsOrigin: "https://app.syncforge.test",
});
const databaseConfig = Object.freeze({
  connectionString: "postgresql://unused:unused@localhost:5432/unused",
});

let app;
let databaseAvailable = true;

before(async () => {
  const database = {
    client: {
      async $queryRaw() {
        if (!databaseAvailable) {
          throw new Error("internal database failure with sensitive context");
        }

        return [{ healthy: 1 }];
      },
      async $disconnect() {},
    },
  };
  const module = await Test.createTestingModule({
    imports: [AppModule.register(databaseConfig)],
    controllers: [ValidationProbeController],
  })
    .overrideProvider(DatabaseService)
    .useValue(database)
    .compile();

  app = module.createNestApplication();
  configureApplication(app, apiConfig);
  await app.init();
});

after(async () => {
  await app?.close();
});

test("startApplication listens on the validated API port", async () => {
  const calls = [];
  const fakeApp = {
    async listen(port) {
      calls.push(["listen", port]);
    },
    async close() {
      calls.push(["close"]);
    },
  };

  const started = await startApplication(
    { API_PORT: "ignored by injected factory" },
    async () => ({ app: fakeApp, config: apiConfig }),
  );

  assert.equal(started, fakeApp);
  assert.deepEqual(calls, [["listen", 3_001]]);
});

test("GET /api/health reports a healthy database without a version segment", async () => {
  databaseAvailable = true;

  const response = await request(app.getHttpServer()).get("/api/health");

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {
    status: "ok",
    dependencies: { database: "up" },
  });

  const versioned = await request(app.getHttpServer()).get("/api/v1/health");
  assert.equal(versioned.status, 404);
});

test("GET /api/health returns a generic 503 when the database is unavailable", async () => {
  databaseAvailable = false;

  const response = await request(app.getHttpServer()).get("/api/health");

  assert.equal(response.status, 503);
  assert.deepEqual(response.body, {
    error: {
      statusCode: 503,
      code: "DEPENDENCY_UNAVAILABLE",
      message: "A required dependency is unavailable",
    },
  });
  assert.doesNotMatch(JSON.stringify(response.body), /database failure|sensitive/);
});

test("unknown routes use the stable public error envelope", async () => {
  const response = await request(app.getHttpServer()).get("/api/unknown");

  assert.equal(response.status, 404);
  assert.deepEqual(response.body, {
    error: {
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Resource not found",
    },
  });
});

test("API root variants use the stable public 404 envelope", async () => {
  const expected = {
    error: {
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Resource not found",
    },
  };

  for (const path of ["/api", "/api/"]) {
    const response = await request(app.getHttpServer()).get(path);

    assert.equal(response.status, 404);
    assert.deepEqual(response.body, expected);
  }
});

test("global validation rejects invalid and excess body fields", async () => {
  const invalid = await request(app.getHttpServer())
    .post("/api/v1/validation-probe")
    .send({ name: 42 });
  const excess = await request(app.getHttpServer())
    .post("/api/v1/validation-probe")
    .send({ name: "valid", unexpected: "rejected" });
  const expected = {
    error: {
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
    },
  };

  assert.equal(invalid.status, 400);
  assert.deepEqual(invalid.body, expected);
  assert.equal(excess.status, 400);
  assert.deepEqual(excess.body, expected);
});

test("JSON payloads above the parser limit use a generic 413 envelope", async () => {
  const secretMarker = "must-not-be-echoed";
  const response = await request(app.getHttpServer())
    .post("/api/v1/validation-probe")
    .send({ name: `${secretMarker}${"x".repeat(110 * 1_024)}` });

  assert.equal(response.status, 413);
  assert.deepEqual(response.body, {
    error: {
      statusCode: 413,
      code: "PAYLOAD_TOO_LARGE",
      message: "Request payload is too large",
    },
  });
  assert.doesNotMatch(JSON.stringify(response.body), new RegExp(secretMarker));
});

test("helmet security headers apply to API responses", async () => {
  databaseAvailable = true;

  const response = await request(app.getHttpServer()).get("/api/health");

  assert.equal(response.headers["x-content-type-options"], "nosniff");
  assert.equal(response.headers["x-frame-options"], "SAMEORIGIN");
  assert.ok(response.headers["content-security-policy"]);
});

test("CORS permits only the configured exact origin without credentials", async () => {
  databaseAvailable = true;

  const allowed = await request(app.getHttpServer())
    .get("/api/health")
    .set("Origin", "https://app.syncforge.test");
  const denied = await request(app.getHttpServer())
    .get("/api/health")
    .set("Origin", "https://app.syncforge.test.evil.example");

  assert.equal(
    allowed.headers["access-control-allow-origin"],
    "https://app.syncforge.test",
  );
  assert.equal(allowed.headers["access-control-allow-credentials"], undefined);
  assert.equal(denied.headers["access-control-allow-origin"], undefined);
});
