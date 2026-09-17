import { Injectable } from "@nestjs/common";
import { ApiUnauthorized } from "../common/http.js";
import { AuthRepository } from "./auth.repository.js";
import { PasswordHasher } from "./password-hasher.service.js";
import { SessionService } from "./session.service.js";

function canonicalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly passwords: PasswordHasher,
    private readonly sessions: SessionService,
  ) {}

  async signup(email: string, password: string) {
    const passwordHash = await this.passwords.hash(password);
    try {
      await this.repository.createUser(canonicalizeEmail(email), passwordHash);
    } catch (error) {
      if (!isUniqueConstraintViolation(error)) throw error;
    }
    return { accepted: true as const };
  }

  async login(email: string, password: string) {
    const user = await this.repository.findUserByEmail(
      canonicalizeEmail(email),
    );
    const matches = await this.passwords.verifyStoredOrDummy(
      user?.passwordHash,
      password,
    );
    if (!user || !matches)
      throw new ApiUnauthorized(
        "INVALID_CREDENTIALS",
        "Invalid email or password",
      );
    const session = await this.sessions.create(user.id);
    return { user: { id: user.id, email: user.email }, ...session };
  }
}
