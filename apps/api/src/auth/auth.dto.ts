import { Transform } from "class-transformer";
import { IsEmail, IsString, Length, MaxLength } from "class-validator";

function canonicalizeEmail({ value }: { readonly value: unknown }): unknown {
  return typeof value === "string" ? value.trim().toLowerCase() : value;
}

export class SignupDto {
  @Transform(canonicalizeEmail)
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @Length(15, 128)
  password!: string;
}

export class LoginDto {
  @Transform(canonicalizeEmail)
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @Length(1, 128)
  password!: string;
}
