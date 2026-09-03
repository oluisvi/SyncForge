import { ServiceUnavailableException } from "@nestjs/common";

export class DependencyUnavailableException extends ServiceUnavailableException {
  constructor() {
    super({ code: "DEPENDENCY_UNAVAILABLE" });
  }
}
