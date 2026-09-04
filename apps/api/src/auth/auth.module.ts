import { Module } from "@nestjs/common";

import { AuthController } from "./auth.controller.js";
import { AuthRateLimitGuard } from "./auth-rate-limit.guard.js";
import { AuthRateLimiter } from "./auth-rate-limiter.service.js";
import { AuthRepository } from "./auth.repository.js";
import { AuthService } from "./auth.service.js";
import { PasswordHasher } from "./password-hasher.service.js";

@Module({
  controllers: [AuthController],
  providers: [
    AuthRepository,
    AuthService,
    PasswordHasher,
    AuthRateLimiter,
    AuthRateLimitGuard,
  ],
})
export class AuthModule {}
