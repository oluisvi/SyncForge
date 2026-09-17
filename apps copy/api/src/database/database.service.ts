import { Inject, Injectable, OnModuleDestroy } from "@nestjs/common";
import type { DatabaseClient } from "@syncforge/database";
import { DATABASE } from "./database.constants.js";

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  constructor(@Inject(DATABASE) readonly client: DatabaseClient) {}
  async onModuleDestroy() { await this.client.$disconnect(); }
}
