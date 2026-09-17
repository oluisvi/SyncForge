import { Inject, Injectable } from "@nestjs/common";
import type { DatabaseClient } from "@syncforge/database";
import { DATABASE } from "../database/database.constants.js";

@Injectable()
export class AuthRepository {
  constructor(@Inject(DATABASE) private readonly db: DatabaseClient) {}
  createUser(email: string, passwordHash: string) {
    return this.db.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true },
    });
  }
  findUserByEmail(email: string) {
    return this.db.user.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true },
    });
  }
}
