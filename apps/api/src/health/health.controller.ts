import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  VERSION_NEUTRAL,
} from "@nestjs/common";

import { HealthService } from "./health.service.js";

@Controller({ path: "health", version: VERSION_NEUTRAL })
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  check() {
    return this.health.check();
  }
}
