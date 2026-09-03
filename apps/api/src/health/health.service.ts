import { Injectable } from "@nestjs/common";
import { checkDatabaseHealth } from "@syncforge/database";

import { DatabaseService } from "../database/database.service.js";
import { DependencyUnavailableException } from "./dependency-unavailable.exception.js";

export interface HealthResponse {
  readonly status: "ok";
  readonly dependencies: {
    readonly database: "up";
  };
}

@Injectable()
export class HealthService {
  constructor(private readonly database: DatabaseService) {}

  async check(): Promise<HealthResponse> {
    try {
      await checkDatabaseHealth(this.database.client);
    } catch {
      throw new DependencyUnavailableException();
    }

    return {
      status: "ok",
      dependencies: {
        database: "up",
      },
    };
  }
}
