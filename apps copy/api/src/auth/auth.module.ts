import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller.js";
import { AuthRepository } from "./auth.repository.js";
import { AuthRateLimitGuard } from "./auth-rate-limit.guard.js";
import { AuthRateLimiter } from "./auth-rate-limiter.service.js";
import { AuthService } from "./auth.service.js";
import { PasswordHasher } from "./password-hasher.service.js";
import { SessionGuard } from "./authenticated.js";
import { SessionService } from "./session.service.js";

@Module({
  controllers: [AuthController],
  providers: [
    AuthRepository,
    AuthRateLimiter,
    AuthRateLimitGuard,
    AuthService,
    PasswordHasher,
    SessionService,
    SessionGuard,
  ],
  exports: [SessionGuard, SessionService],
})
export class AuthModule {}
