import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

import { AUTH_RATE_LIMITS } from "./auth.constants.js";

interface RateLimitEntry {
  minute: number[];
  hour: number[];
  lastSeenAt: number;
}

@Injectable()
/**
 * Process-local protection for a single API instance. A distributed limiter is
 * required before horizontally scaling authentication traffic.
 */
export class AuthRateLimiter {
  private readonly entries = new Map<string, RateLimitEntry>();

  consume(ip: string, endpoint: string, now = Date.now()): void {
    this.pruneExpired(now);

    const key = `${endpoint}\u0000${ip}`;
    const entry = this.entries.get(key) ?? {
      minute: [],
      hour: [],
      lastSeenAt: now,
    };

    entry.minute = entry.minute.filter(
      (timestamp) => now - timestamp < AUTH_RATE_LIMITS.minute.windowMs,
    );
    entry.hour = entry.hour.filter(
      (timestamp) => now - timestamp < AUTH_RATE_LIMITS.hour.windowMs,
    );

    if (
      entry.minute.length >= AUTH_RATE_LIMITS.minute.limit ||
      entry.hour.length >= AUTH_RATE_LIMITS.hour.limit
    ) {
      entry.lastSeenAt = now;
      this.entries.set(key, entry);
      throw new HttpException({}, HttpStatus.TOO_MANY_REQUESTS);
    }

    if (
      !this.entries.has(key) &&
      this.entries.size >= AUTH_RATE_LIMITS.maxKeys
    ) {
      this.evictOldest();
    }

    entry.minute.push(now);
    entry.hour.push(now);
    entry.lastSeenAt = now;
    this.entries.set(key, entry);
  }

  reset(): void {
    this.entries.clear();
  }

  private pruneExpired(now: number): void {
    for (const [key, entry] of this.entries) {
      if (now - entry.lastSeenAt >= AUTH_RATE_LIMITS.hour.windowMs) {
        this.entries.delete(key);
      }
    }
  }

  private evictOldest(): void {
    let oldestKey: string | undefined;
    let oldestSeenAt = Number.POSITIVE_INFINITY;

    for (const [key, entry] of this.entries) {
      if (entry.lastSeenAt < oldestSeenAt) {
        oldestKey = key;
        oldestSeenAt = entry.lastSeenAt;
      }
    }

    if (oldestKey !== undefined) {
      this.entries.delete(oldestKey);
    }
  }
}
