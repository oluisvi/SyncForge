import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "./generated/prisma/client.js";
import type { DatabaseConfig } from "./config.js";

export function createDatabaseClient(config: DatabaseConfig): PrismaClient {
  const adapter = new PrismaPg({ connectionString: config.connectionString });

  return new PrismaClient({ adapter });
}

export type DatabaseClient = PrismaClient;
