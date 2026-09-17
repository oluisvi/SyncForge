import { Inject, Injectable, ServiceUnavailableException } from "@nestjs/common";
import type { DatabaseClient } from "@syncforge/database";
import { checkDatabase } from "@syncforge/database";
import { DATABASE } from "../database/database.constants.js";
@Injectable()
export class HealthService {
  constructor(@Inject(DATABASE) private readonly db: DatabaseClient) {}
  async status() {
    try { await checkDatabase(this.db); return { status: "ok", database: "ok", timestamp: new Date().toISOString() }; }
    catch { throw new ServiceUnavailableException({ status: "degraded", database: "unavailable", timestamp: new Date().toISOString() }); }
  }
}
