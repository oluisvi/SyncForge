import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, beforeEach, describe, test } from "node:test";

import { Test } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../dist/app.module.js";
import { AuthRateLimiter } from "../dist/auth/auth-rate-limiter.service.js";
import { AuthService } from "../dist/auth/auth.service.js";
import { PasswordHasher } from "../dist/auth/password-hasher.service.js";
import { configureApplication } from "../dist/application.js";
import { DatabaseService } from "../dist/database/database.service.js";

const apiConfig = Object.freeze({
  nodeEnvironment: "test",
  port: 3_001,
  corsOrigin: "https://app.syncforge.test",
});
const databaseConfig = Object.freeze({
  connectionString: "postgresql://unused:unused@localhost:5432/unused",
});

const users = new Map();
const attemptedHashes = [];

const database = {
  client: {
    user: {
      async create({ data }) {
        attemptedHashes.push(data.passwordHash);

        if (users.has(data.email)) {
          throw Object.assign(new Error("database detail must stay private"), {
            code: "P2002",
          });
        }

        const user = {
          id: randomUUID(),
          email: data.email,
          passwordHash: data.passwordHash,
        };
        users.set(data.email, user);
        return { id: user.id };
      },
      async findUnique({ where }) {
        return users.get(where.email) ?? null;
      },
    },
    async $queryRaw() {
      return [{ healthy: 1 }];
    },
    async $disconnect() {},
  },
};

let app;
let limiter;

before(async () => {
  const module = await Test.createTestingModule({
    imports: [AppModule.register(databaseConfig)],
  })
    .overrideProvider(DatabaseService)
    .useValue(database)
    .compile();

  app = module.createNestApplication();
  configureApplication(app, apiConfig);
  await app.init();
  limiter = app.get(AuthRateLimiter);
});

beforeEach(() => {
  users.clear();
  attemptedHashes.length = 0;
  limiter.reset();
});

after(async () => {
  await app?.close();
});

describe("password hashing", () => {
  test("uses salted Argon2id with the required work factors", async () => {
    const hasher = new PasswordHasher();
    const first = await hasher.hash("correct horse battery staple");
    const second = await hasher.hash("correct horse battery staple");

    assert.notEqual(first, second);
    assert.match(first, /^\$argon2id\$v=19\$m=19456,p=1,t=2\$/);
    assert.equal(Buffer.from(first.split("$").at(-1), "base64").byteLength, 32);
    assert.equal(
      await hasher.verify(first, "correct horse battery staple"),
      true,
    );
    assert.equal(await hasher.verify(first, "wrong credential"), false);
    assert.equal(await hasher.verify("corrupted hash", "credential"), false);
  });
});

describe("POST /api/v1/auth/signup", () => {
  test("returns indistinguishable accepted responses for new and duplicate accounts", async () => {
    const payload = {
      email: "  Person@Example.COM ",
      password: "a secure password",
    };
    const first = await request(app.getHttpServer())
      .post("/api/v1/auth/signup")
      .send(payload);
    const duplicate = await request(app.getHttpServer())
      .post("/api/v1/auth/signup")
      .send(payload);

    for (const response of [first, duplicate]) {
      assert.equal(response.status, 202);
      assert.deepEqual(response.body, { accepted: true });
      assert.equal(response.headers["cache-control"], "no-store");
      assert.doesNotMatch(
        JSON.stringify(response.body),
        /person@example\.com|secure password|argon2/i,
      );
    }

    assert.equal(users.size, 1);
    assert.ok(users.has("person@example.com"));
    assert.equal(attemptedHashes.length, 2);
    assert.notEqual(attemptedHashes[0], attemptedHashes[1]);
  });

  test("allows exactly one user under concurrent signup", async () => {
    const payload = {
      email: "race@example.com",
      password: "concurrent password",
    };
    const [first, second] = await Promise.all([
      request(app.getHttpServer()).post("/api/v1/auth/signup").send(payload),
      request(app.getHttpServer()).post("/api/v1/auth/signup").send(payload),
    ]);

    assert.equal(first.status, 202);
    assert.equal(second.status, 202);
    assert.deepEqual(first.body, second.body);
    assert.equal(users.size, 1);
  });

  test("canonicalizes only email and preserves Unicode and spaces in passwords", async () => {
    const password = "  🔐 senha com espaços  ";
    const signup = await request(app.getHttpServer())
      .post("/api/v1/auth/signup")
      .send({ email: "  Unicode@Example.COM  ", password });
    const withoutSpaces = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: "unicode@example.com", password: password.trim() });
    const exact = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: "UNICODE@EXAMPLE.COM", password });

    assert.equal(signup.status, 202);
    assert.equal(withoutSpaces.status, 401);
    assert.equal(exact.status, 200);
    assert.equal(exact.body.user.email, "unicode@example.com");
  });

  test("rejects invalid DTOs, extra fields, and password bounds generically", async () => {
    const cases = [
      { email: "not-an-email", password: "long enough password" },
      { email: "user@example.com", password: "x".repeat(14) },
      { email: "user@example.com", password: "x".repeat(129) },
      {
        email: "user@example.com",
        password: "long enough password",
        unexpected: "secret marker",
      },
    ];

    for (const body of cases) {
      const response = await request(app.getHttpServer())
        .post("/api/v1/auth/signup")
        .send(body);

      assert.equal(response.status, 400);
      assert.deepEqual(response.body, {
        error: {
          statusCode: 400,
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
        },
      });
      assert.equal(response.headers["cache-control"], "no-store");
      assert.doesNotMatch(JSON.stringify(response.body), /secret marker/);
    }
  });
});

describe("POST /api/v1/auth/login", () => {
  test("returns only the public user shape for valid credentials", async () => {
    const email = "login@example.com";
    const password = "valid login password";
    await request(app.getHttpServer())
      .post("/api/v1/auth/signup")
      .send({ email, password });

    const response = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: "  LOGIN@EXAMPLE.COM ", password });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      authenticated: true,
      user: {
        id: users.get(email).id,
        email,
      },
    });
    assert.equal(response.headers["cache-control"], "no-store");
    assert.equal("passwordHash" in response.body.user, false);
    assert.equal("password" in response.body, false);
  });

  test("returns the same generic 401 for wrong, unknown, and corrupted hashes", async () => {
    const email = "known@example.com";
    const password = "known user password";
    await request(app.getHttpServer())
      .post("/api/v1/auth/signup")
      .send({ email, password });

    const wrong = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email, password: "wrong password value" });
    const unknown = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: "unknown@example.com", password: "wrong password value" });
    users.get(email).passwordHash = "database-corrupted-hash";
    const corrupted = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email, password });
    const expected = {
      error: {
        statusCode: 401,
        code: "INVALID_CREDENTIALS",
        message: "Credentials are invalid",
      },
    };

    for (const response of [wrong, unknown, corrupted]) {
      assert.equal(response.status, 401);
      assert.deepEqual(response.body, expected);
      assert.equal(response.headers["cache-control"], "no-store");
      assert.doesNotMatch(
        JSON.stringify(response.body),
        /known@example|wrong password|database-corrupted|argon2/i,
      );
    }
  });

  test("uses the verification path for both known and unknown accounts", async () => {
    const calls = [];
    const repository = {
      async findUserByEmail(email) {
        return email === "known@example.com"
          ? { id: "user-id", email, passwordHash: "stored-hash" }
          : null;
      },
    };
    const passwords = {
      async verifyStoredOrDummy(passwordHash, password) {
        calls.push({ passwordHash, password });
        return false;
      },
    };
    const service = new AuthService(repository, passwords);

    await assert.rejects(
      service.login("known@example.com", "submitted password"),
    );
    await assert.rejects(
      service.login("unknown@example.com", "submitted password"),
    );

    assert.deepEqual(calls, [
      { passwordHash: "stored-hash", password: "submitted password" },
      { passwordHash: undefined, password: "submitted password" },
    ]);
  });

  test("rejects empty, oversized, and excess login fields", async () => {
    const cases = [
      { email: "user@example.com", password: "" },
      { email: "user@example.com", password: "x".repeat(129) },
      {
        email: "user@example.com",
        password: "any password",
        token: "must not be accepted",
      },
    ];

    for (const body of cases) {
      const response = await request(app.getHttpServer())
        .post("/api/v1/auth/login")
        .send(body);

      assert.equal(response.status, 400);
      assert.equal(response.body.error.code, "VALIDATION_ERROR");
      assert.equal(response.headers["cache-control"], "no-store");
      assert.doesNotMatch(
        JSON.stringify(response.body),
        /must not be accepted/,
      );
    }
  });

  test("does not cache or expose oversized authentication payloads", async () => {
    const secretMarker = "authentication-secret-marker";
    const response = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({
        email: "user@example.com",
        password: `${secretMarker}${"x".repeat(110 * 1_024)}`,
      });

    assert.equal(response.status, 413);
    assert.equal(response.headers["cache-control"], "no-store");
    assert.doesNotMatch(
      JSON.stringify(response.body),
      new RegExp(secretMarker),
    );
  });
});

describe("authentication rate limiting", () => {
  test("enforces 10 requests per minute before password work and ignores X-Forwarded-For", async () => {
    for (let index = 0; index < 10; index += 1) {
      const response = await request(app.getHttpServer())
        .post("/api/v1/auth/login")
        .set("X-Forwarded-For", `203.0.113.${index}`)
        .send({ email: "unknown@example.com", password: "attempted password" });
      assert.equal(response.status, 401);
    }

    const limited = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .set("X-Forwarded-For", "198.51.100.200")
      .send({ email: "unknown@example.com", password: "attempted password" });

    assert.equal(limited.status, 429);
    assert.deepEqual(limited.body, {
      error: {
        statusCode: 429,
        code: "TOO_MANY_REQUESTS",
        message: "Too many requests",
      },
    });
    assert.equal(limited.headers["cache-control"], "no-store");
  });

  test("isolates endpoints and resets expired windows without timers", () => {
    const unitLimiter = new AuthRateLimiter();

    for (let index = 0; index < 10; index += 1) {
      unitLimiter.consume("127.0.0.1", "login", 0);
    }

    assert.throws(() => unitLimiter.consume("127.0.0.1", "login", 1));
    assert.doesNotThrow(() => unitLimiter.consume("127.0.0.1", "signup", 1));
    assert.doesNotThrow(() =>
      unitLimiter.consume("127.0.0.1", "login", 60_000),
    );

    unitLimiter.reset();
    assert.doesNotThrow(() => unitLimiter.consume("127.0.0.1", "login", 2));
  });
});
