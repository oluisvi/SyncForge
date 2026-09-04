import { Injectable } from "@nestjs/common";
import { argon2id, hash, verify } from "argon2";

const HASH_OPTIONS = Object.freeze({
  type: argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  hashLength: 32,
});

// Precomputed with HASH_OPTIONS so an unknown account never pays an extra hash
// during process cold start. It is not a credential and can safely be public.
const DUMMY_HASH =
  "$argon2id$v=19$m=19456,p=1,t=2$isQXNd6G783Z49PsdwjKaQ$8gs7cONMCX1o2NmeYVCtvIyLE90/3o/7rrizctVnxg8";

@Injectable()
export class PasswordHasher {
  hash(password: string): Promise<string> {
    return hash(password, HASH_OPTIONS);
  }

  async verify(passwordHash: string, password: string): Promise<boolean> {
    try {
      return await verify(passwordHash, password);
    } catch {
      return false;
    }
  }

  async verifyStoredOrDummy(
    passwordHash: string | undefined,
    password: string,
  ): Promise<boolean> {
    return this.verify(passwordHash ?? DUMMY_HASH, password);
  }
}
