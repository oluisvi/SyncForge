import { Module } from "@nestjs/common";
import type { DynamicModule } from "@nestjs/common";
import type { DatabaseConfig } from "@syncforge/database";

import { FallbackModule } from "./common/http/fallback.module.js";
import { DatabaseModule } from "./database/database.module.js";
import { HealthModule } from "./health/health.module.js";

@Module({})
export class AppModule {
  static register(databaseConfig: DatabaseConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [DatabaseModule.register(databaseConfig), HealthModule, FallbackModule],
    };
  }
}
