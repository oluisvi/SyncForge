import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  SetMetadata,
  UseGuards,
} from "@nestjs/common";

import { AUTH_RATE_LIMIT_ENDPOINT } from "./auth.constants.js";
import { LoginDto, SignupDto } from "./auth.dto.js";
import { AuthRateLimitGuard } from "./auth-rate-limit.guard.js";
import { AuthService } from "./auth.service.js";

@Controller({ path: "auth", version: "1" })
@UseGuards(AuthRateLimitGuard)
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("signup")
  @HttpCode(HttpStatus.ACCEPTED)
  @SetMetadata(AUTH_RATE_LIMIT_ENDPOINT, "signup")
  signup(@Body() body: SignupDto) {
    return this.auth.signup(body.email, body.password);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @SetMetadata(AUTH_RATE_LIMIT_ENDPOINT, "login")
  login(@Body() body: LoginDto) {
    return this.auth.login(body.email, body.password);
  }
}
