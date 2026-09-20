import { createHash, randomBytes } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import type { DatabaseClient } from "@syncforge/database";
import { DATABASE } from "../database/database.constants.js";
import { loadApiConfig } from "../config/api.config.js";

function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

@Injectable()
export class SessionService {
  private readonly config = loadApiConfig(process.env);
  constructor(@Inject(DATABASE) private readonly db: DatabaseClient) {}

  async create(userId: string) {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(
      Date.now() + this.config.sessionTtlHours * 60 * 60 * 1000,
    );
    await this.db.session.create({
      data: { userId, tokenHash: hashToken(token), expiresAt },
    });
    return { token, expiresAt };
  }

  async authenticate(token: string) {
    const now = new Date();
    const session = await this.db.session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: { select: { id: true, email: true } } },
    });
    if (!session || session.revokedAt || session.expiresAt <= now) return null;
    if (now.getTime() - session.lastSeenAt.getTime() > 5 * 60 * 1000) {
      void this.db.session
        .update({ where: { id: session.id }, data: { lastSeenAt: now } })
        .catch(() => undefined);
    }
    return {
      sessionId: session.id,
      user: session.user,
      expiresAt: session.expiresAt,
    };
  }

  async revoke(token: string | undefined) {
    if (!token) return;
    await this.db.session.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
