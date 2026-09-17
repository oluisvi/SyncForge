import assert from "node:assert/strict";
import test from "node:test";
import { buildExpiredSessionCookie, buildSessionCookie, parseCookie } from "../dist/auth/session-cookie.js";

test("session cookie is HttpOnly, SameSite=Lax and optionally Secure", () => {
  const cookie = buildSessionCookie("secret token", new Date("2030-01-01T00:00:00Z"), true);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Secure/);
  assert.equal(parseCookie(cookie, "syncforge_session"), "secret token");
});

test("expired cookie clears the session", () => {
  assert.match(buildExpiredSessionCookie(false), /Max-Age=0/);
});
