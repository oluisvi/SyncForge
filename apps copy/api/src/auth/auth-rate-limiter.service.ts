import { Injectable } from "@nestjs/common";
import { TooManyRequestsException } from "@nestjs/common";

type Entry = { count: number; resetAt: number };
@Injectable()
export class AuthRateLimiter {
  private readonly entries = new Map<string, Entry>();
  check(key: string, limit = 12, windowMs = 60_000): void {
    const now = Date.now();
    const current = this.entries.get(key);
    if (!current || current.resetAt <= now) {
      this.entries.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }
    current.count += 1;
    if (current.count > limit)
      throw new TooManyRequestsException({
        error: {
          code: "RATE_LIMITED",
          message: "Too many authentication attempts",
        },
      });
    if (this.entries.size > 5_000) {
      for (const [entryKey, entry] of this.entries)
        if (entry.resetAt <= now) this.entries.delete(entryKey);
    }
  }
}
