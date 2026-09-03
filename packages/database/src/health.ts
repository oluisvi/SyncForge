import type { DatabaseClient } from "./client.js";

export interface DatabaseHealth {
  readonly healthy: true;
}

export async function checkDatabaseHealth(
  client: DatabaseClient,
): Promise<DatabaseHealth> {
  const rows = await client.$queryRaw<
    Array<{ healthy: number }>
  >`SELECT 1 AS healthy`;

  if (rows[0]?.healthy !== 1) {
    throw new Error("PostgreSQL health check returned an unexpected result");
  }

  return Object.freeze({ healthy: true });
}
