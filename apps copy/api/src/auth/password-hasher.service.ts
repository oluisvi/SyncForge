import { Injectable } from "@nestjs/common";
import * as argon2 from "argon2";

const options = { type: argon2.argon2id, memoryCost: 19 * 1024, timeCost: 2, parallelism: 1 } as const;

@Injectable()
export class PasswordHasher {
  private dummyHashPromise: Promise<string> | undefined;
  hash(password: string) { return argon2.hash(password, options); }
  verify(hash: string, password: string) { return argon2.verify(hash, password, options); }
  private dummyHash() {
    this.dummyHashPromise ??= this.hash("syncforge-dummy-password-never-used");
    return this.dummyHashPromise;
  }
  async verifyStoredOrDummy(hash: string | undefined, password: string): Promise<boolean> {
    const target = hash ?? (await this.dummyHash());
    const matches = await this.verify(target, password);
    return Boolean(hash) && matches;
  }
}
