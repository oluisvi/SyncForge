import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { loadApiConfig } from "../config/api.config.js";
import { AuthRateLimitGuard } from "./auth-rate-limit.guard.js";
import { LoginDto, SignupDto } from "./auth.dto.js";
import { AuthService } from "./auth.service.js";
import { CurrentUser, SessionGuard } from "./authenticated.js";
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from "./authenticated.js";
import {
  buildExpiredSessionCookie,
  buildSessionCookie,
} from "./session-cookie.js";
import { SessionService } from "./session.service.js";

type HeaderResponse = { setHeader(name: string, value: string): void };

@Controller({ path: "auth", version: "1" })
export class AuthController {
  private readonly config = loadApiConfig(process.env);
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
  ) {}

  @Post("signup")
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(AuthRateLimitGuard)
  signup(@Body() body: SignupDto) {
    return this.auth.signup(body.email, body.password);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthRateLimitGuard)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: HeaderResponse,
  ) {
    const result = await this.auth.login(body.email, body.password);
    response.setHeader(
      "Set-Cookie",
      buildSessionCookie(
        result.token,
        result.expiresAt,
        this.config.sessionCookieSecure,
      ),
    );
    return {
      authenticated: true,
      user: result.user,
      expiresAt: result.expiresAt,
    };
  }

  @Get("me")
  @UseGuards(SessionGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    return { authenticated: true, user };
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(SessionGuard)
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: HeaderResponse,
  ) {
    await this.sessions.revoke(request.sessionToken);
    response.setHeader(
      "Set-Cookie",
      buildExpiredSessionCookie(this.config.sessionCookieSecure),
    );
  }
}
