import {
  enumValue,
  integerValue,
  loadEnvironment,
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

const apiEnvironmentSchema = {
  NODE_ENV: withDefault(
    enumValue(["development", "test", "production"]),
    "development",
  ),
  API_PORT: withDefault(integerValue({ min: 1, max: 65_535 }), 3_001),
  API_CORS_ORIGIN: httpOrigin,
};

export function loadApiConfig(source: EnvironmentSource) {
  const environment = loadEnvironment(apiEnvironmentSchema, source);

  return Object.freeze({
    nodeEnvironment: environment.NODE_ENV,
    port: environment.API_PORT,
    corsOrigin: environment.API_CORS_ORIGIN,
  });
}

export type ApiConfig = ReturnType<typeof loadApiConfig>;
