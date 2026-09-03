import { Global, Module } from "@nestjs/common";
import type { DynamicModule } from "@nestjs/common";
import type { DatabaseConfig } from "@syncforge/database";

import { DATABASE_CONFIG } from "./database.constants.js";
import { DatabaseService } from "./database.service.js";

@Global()
@Module({})
export class DatabaseModule {
  static register(config: DatabaseConfig): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: DATABASE_CONFIG,
          useValue: config,
        },
        DatabaseService,
      ],
      exports: [DatabaseService],
    };
  }
}
