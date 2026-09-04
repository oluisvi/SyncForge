import { Catch, HttpException, HttpStatus } from "@nestjs/common";
import type { ArgumentsHost, ExceptionFilter } from "@nestjs/common";
import type { HttpAdapterHost } from "@nestjs/core";

interface PublicError {
  readonly code: string;
  readonly message: string;
}

const publicErrors = new Map<number, PublicError>([
  [
    HttpStatus.BAD_REQUEST,
    { code: "BAD_REQUEST", message: "Request is invalid" },
  ],
  [
    HttpStatus.UNAUTHORIZED,
    { code: "UNAUTHORIZED", message: "Authentication is required" },
  ],
  [HttpStatus.FORBIDDEN, { code: "FORBIDDEN", message: "Access is forbidden" }],
  [HttpStatus.NOT_FOUND, { code: "NOT_FOUND", message: "Resource not found" }],
  [
    HttpStatus.CONFLICT,
    { code: "CONFLICT", message: "Request conflicts with current state" },
  ],
  [
    HttpStatus.UNPROCESSABLE_ENTITY,
    { code: "UNPROCESSABLE_ENTITY", message: "Request cannot be processed" },
  ],
  [
    HttpStatus.TOO_MANY_REQUESTS,
    { code: "TOO_MANY_REQUESTS", message: "Too many requests" },
  ],
  [
    HttpStatus.PAYLOAD_TOO_LARGE,
    { code: "PAYLOAD_TOO_LARGE", message: "Request payload is too large" },
  ],
  [
    HttpStatus.SERVICE_UNAVAILABLE,
    { code: "SERVICE_UNAVAILABLE", message: "Service is unavailable" },
  ],
]);

const explicitErrors = new Map<string, PublicError>([
  [
    "INVALID_CREDENTIALS",
    {
      code: "INVALID_CREDENTIALS",
      message: "Credentials are invalid",
    },
  ],
  [
    "VALIDATION_ERROR",
    { code: "VALIDATION_ERROR", message: "Request validation failed" },
  ],
  [
    "DEPENDENCY_UNAVAILABLE",
    {
      code: "DEPENDENCY_UNAVAILABLE",
      message: "A required dependency is unavailable",
    },
  ],
]);

function getExplicitError(exception: HttpException): PublicError | undefined {
  const response = exception.getResponse();

  if (
    typeof response !== "object" ||
    response === null ||
    !("code" in response)
  ) {
    return undefined;
  }

  const { code } = response;
  return typeof code === "string" ? explicitErrors.get(code) : undefined;
}

function isPayloadTooLargeError(
  exception: unknown,
): exception is { readonly status: 413; readonly type: "entity.too.large" } {
  return (
    typeof exception === "object" &&
    exception !== null &&
    "status" in exception &&
    exception.status === HttpStatus.PAYLOAD_TOO_LARGE &&
    "type" in exception &&
    exception.type === "entity.too.large"
  );
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  constructor(private readonly adapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const candidateStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : isPayloadTooLargeError(exception)
          ? HttpStatus.PAYLOAD_TOO_LARGE
          : HttpStatus.INTERNAL_SERVER_ERROR;
    const status =
      candidateStatus >= 400 && candidateStatus <= 599
        ? candidateStatus
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const publicError =
      exception instanceof HttpException
        ? (getExplicitError(exception) ?? publicErrors.get(status))
        : isPayloadTooLargeError(exception)
          ? publicErrors.get(HttpStatus.PAYLOAD_TOO_LARGE)
          : undefined;
    const error = publicError ?? {
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
    };

    this.adapterHost.httpAdapter.reply(
      http.getResponse(),
      {
        error: {
          statusCode: status,
          code: error.code,
          message: error.message,
        },
      },
      status,
    );
  }
}
