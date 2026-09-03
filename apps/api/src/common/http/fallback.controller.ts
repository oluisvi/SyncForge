import {
  All,
  Controller,
  NotFoundException,
  VERSION_NEUTRAL,
} from "@nestjs/common";

@Controller({ version: VERSION_NEUTRAL })
export class FallbackController {
  @All()
  rootNotFound(): never {
    throw new NotFoundException();
  }

  @All("{*path}")
  notFound(): never {
    throw new NotFoundException();
  }
}
