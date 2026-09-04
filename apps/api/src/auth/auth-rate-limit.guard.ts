import { Injectable } from "@nestjs/common";
import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { AUTH_RATE_LIMIT_ENDPOINT } from "./auth.constants.js";
import { AuthRateLimiter } from "./auth-rate-limiter.service.js";

interface HttpRequestWithSocket {
  readonly socket?: {
    readonly remoteAddress?: string;
  };
}

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  constructor(
    private readonly limiter: AuthRateLimiter,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const endpoint = this.reflector.get<string>(
      AUTH_RATE_LIMIT_ENDPOINT,
      context.getHandler(),
    );

    if (endpoint === undefined) {
      return true;
    }

    const request = context.switchToHttp().getRequest<HttpRequestWithSocket>();
    this.limiter.consume(request.socket?.remoteAddress ?? "unknown", endpoint);

    return true;
  }
}
