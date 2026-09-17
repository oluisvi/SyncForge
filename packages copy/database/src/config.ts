import { loadEnvironment, urlValue } from "@syncforge/config";
import type { EnvironmentSource } from "@syncforge/config";

const databaseEnvironmentSchema = {
  DATABASE_URL: urlValue({ protocols: ["postgresql:", "postgres:"] }),
};

export function loadDatabaseConfig(source: EnvironmentSource) {
  const environment = loadEnvironment(databaseEnvironmentSchema, source);
  return Object.freeze({
    connectionString: environment.DATABASE_URL.toString(),
  });
}
export type DatabaseConfig = ReturnType<typeof loadDatabaseConfig>;
