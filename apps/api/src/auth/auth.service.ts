import { Injectable } from "@nestjs/common";

import { AuthRepository } from "./auth.repository.js";
import { InvalidCredentialsException } from "./auth.exceptions.js";
import { PasswordHasher } from "./password-hasher.service.js";

export interface SignupResponse {
  readonly accepted: true;
}

export interface LoginResponse {
  readonly authenticated: true;
  readonly user: {
    readonly id: string;
    readonly email: string;
  };
}

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
  ) {}

  async signup(email: string, password: string): Promise<SignupResponse> {
    const canonicalEmail = canonicalizeEmail(email);
    const passwordHash = await this.passwords.hash(password);

    try {
      await this.repository.createUser(canonicalEmail, passwordHash);
    } catch (error) {
      if (!isUniqueConstraintViolation(error)) {
        throw error;
      }
    }

    return { accepted: true };
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await this.repository.findUserByEmail(
      canonicalizeEmail(email),
    );
    const passwordMatches = await this.passwords.verifyStoredOrDummy(
      user?.passwordHash,
      password,
    );

    if (!user || !passwordMatches) {
      throw new InvalidCredentialsException();
    }

    return {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }
}
