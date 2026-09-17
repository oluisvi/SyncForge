import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { AuthRateLimiter } from "./auth-rate-limiter.service.js";

type RequestLike = {
  ip?: string;
  socket?: { remoteAddress?: string };
  route?: { path?: string };
};
@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  constructor(private readonly limiter: AuthRateLimiter) {}
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestLike>();
    const remoteAddress =
      request.socket?.remoteAddress ?? request.ip ?? "unknown";
    const route = request.route?.path ?? "auth";
    this.limiter.check(`${remoteAddress}:${route}`);
    return true;
  }
}
