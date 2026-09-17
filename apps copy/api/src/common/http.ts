import { BadRequestException, ForbiddenException, NotFoundException, UnauthorizedException } from "@nestjs/common";
export class ApiBadRequest extends BadRequestException { constructor(code: string, message: string) { super({ error: { code, message } }); } }
export class ApiUnauthorized extends UnauthorizedException { constructor(code = "UNAUTHENTICATED", message = "Authentication required") { super({ error: { code, message } }); } }
export class ApiForbidden extends ForbiddenException { constructor(code = "FORBIDDEN", message = "You do not have access to this resource") { super({ error: { code, message } }); } }
export class ApiNotFound extends NotFoundException { constructor(code = "NOT_FOUND", message = "Resource not found") { super({ error: { code, message } }); } }
