import { Global, Module } from "@nestjs/common";
import { createDatabaseClient, loadDatabaseConfig } from "@syncforge/database";
import { DATABASE } from "./database.constants.js";
import { DatabaseService } from "./database.service.js";

@Global()
@Module({
  providers: [
    { provide: DATABASE, useFactory: () => createDatabaseClient(loadDatabaseConfig(process.env)) },
    DatabaseService,
  ],
  exports: [DATABASE, DatabaseService],
})
export class DatabaseModule {}
