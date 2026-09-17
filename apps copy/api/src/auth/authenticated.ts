import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
} from "@nestjs/common";
import { ApiUnauthorized } from "../common/http.js";
import { parseCookie, SESSION_COOKIE } from "./session-cookie.js";
import { SessionService } from "./session.service.js";

export interface AuthenticatedUser {
  readonly id: string;
  readonly email: string;
}
export interface AuthenticatedRequest {
  readonly headers: Readonly<Record<string, string | string[] | undefined>>;
  user?: AuthenticatedUser;
  sessionToken?: string;
}

function headerValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
function bearer(value: string | undefined): string | undefined {
  if (!value?.startsWith("Bearer ")) return undefined;
  const token = value.slice(7).trim();
  return token || undefined;
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token =
      parseCookie(headerValue(request.headers.cookie), SESSION_COOKIE) ??
      bearer(headerValue(request.headers.authorization));
    if (!token) throw new ApiUnauthorized();
    const session = await this.sessions.authenticate(token);
    if (!session)
      throw new ApiUnauthorized(
        "SESSION_EXPIRED",
        "Session expired or invalid",
      );
    request.user = session.user;
    request.sessionToken = token;
    return true;
  }
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) throw new ApiUnauthorized();
    return request.user;
  },
);
