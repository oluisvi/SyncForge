import { loadEnvironment, urlValue } from "@syncforge/config";
import type { EnvironmentSource } from "@syncforge/config";

const databaseEnvironmentSchema = {
  DATABASE_URL: urlValue({ protocols: ["postgres:", "postgresql:"] }),
};

export function loadDatabaseConfig(source: EnvironmentSource) {
  const environment = loadEnvironment(databaseEnvironmentSchema, source);

  return Object.freeze({
    connectionString: environment.DATABASE_URL.href,
  });
}

export type DatabaseConfig = ReturnType<typeof loadDatabaseConfig>;
