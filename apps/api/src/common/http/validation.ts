import { BadRequestException, ValidationPipe } from "@nestjs/common";

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    stopAtFirstError: false,
    validationError: {
      target: false,
      value: false,
    },
    transformOptions: {
      enableImplicitConversion: false,
    },
    exceptionFactory: () =>
      new BadRequestException({
        code: "VALIDATION_ERROR",
      }),
  });
}
