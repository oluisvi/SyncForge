import { Inject, Injectable } from "@nestjs/common";
import type { OnApplicationShutdown } from "@nestjs/common";
import { createDatabaseClient } from "@syncforge/database";
import type { DatabaseClient, DatabaseConfig } from "@syncforge/database";

import { DATABASE_CONFIG } from "./database.constants.js";

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  readonly client: DatabaseClient;

  constructor(@Inject(DATABASE_CONFIG) config: DatabaseConfig) {
    this.client = createDatabaseClient(config);
  }

  async onApplicationShutdown(): Promise<void> {
    await this.client.$disconnect();
  }
}
