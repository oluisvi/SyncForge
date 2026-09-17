import type { DatabaseClient } from "./client.js";
export async function checkDatabase(client: DatabaseClient): Promise<void> {
  await client.$queryRawUnsafe("SELECT 1");
}
