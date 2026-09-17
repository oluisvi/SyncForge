import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
export class CreateOrganizationDto { @IsString() @MinLength(2) @MaxLength(120) name!: string; }
export class AddMemberDto { @IsEmail() @MaxLength(254) email!: string; @IsOptional() @IsIn(["ADMIN", "MEMBER"]) role?: "ADMIN" | "MEMBER"; }
export class UpdateMemberRoleDto { @IsIn(["ADMIN", "MEMBER"]) role!: "ADMIN" | "MEMBER"; }
