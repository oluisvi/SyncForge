import {
  booleanValue,
  enumValue,
  integerValue,
  loadEnvironment,
  optional,
  stringValue,
  urlValue,
  withDefault,
} from "@syncforge/config";
import type { EnvironmentRule, EnvironmentSource } from "@syncforge/config";

const httpUrl = urlValue({ protocols: ["http:", "https:"] });
const httpOrigin: EnvironmentRule<string> = {
  parse(value, key) {
    const parsed = httpUrl.parse(value, key);
    if (
      parsed.username ||
      parsed.password ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    ) {
      throw new Error(
        `${key} must be an origin without credentials, path, query, or fragment`,
      );
    }
    return parsed.origin;
  },
};
const schema = {
  NODE_ENV: withDefault(
    enumValue(["development", "test", "production"]),
    "development",
  ),
  API_PORT: withDefault(integerValue({ min: 1, max: 65_535 }), 3001),
  API_CORS_ORIGIN: httpOrigin,
  SESSION_TTL_HOURS: withDefault(integerValue({ min: 1, max: 24 * 365 }), 168),
  SESSION_COOKIE_SECURE: withDefault(booleanValue(), false),
  GITHUB_TOKEN: optional(stringValue()),
};
export function loadApiConfig(source: EnvironmentSource) {
  const env = loadEnvironment(schema, source);
  return Object.freeze({
    nodeEnvironment: env.NODE_ENV,
    port: env.API_PORT,
    corsOrigin: env.API_CORS_ORIGIN,
    sessionTtlHours: env.SESSION_TTL_HOURS,
    sessionCookieSecure: env.SESSION_COOKIE_SECURE,
    githubToken: env.GITHUB_TOKEN,
  });
}
export type ApiConfig = ReturnType<typeof loadApiConfig>;
