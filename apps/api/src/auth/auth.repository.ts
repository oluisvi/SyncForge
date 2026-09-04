import { Injectable } from "@nestjs/common";

import { DatabaseService } from "../database/database.service.js";

export interface AuthUserRecord {
  readonly id: string;
  readonly email: string;
  readonly passwordHash: string;
}

@Injectable()
export class AuthRepository {
  constructor(private readonly database: DatabaseService) {}

  async createUser(email: string, passwordHash: string): Promise<void> {
    await this.database.client.user.create({
      data: { email, passwordHash },
      select: { id: true },
    });
  }

  findUserByEmail(email: string): Promise<AuthUserRecord | null> {
    return this.database.client.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
    });
  }
}
