import {
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from "class-validator";
export class CreateProjectDto {
  @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @IsOptional() @IsString() @MaxLength(600) description?: string;
  @IsOptional()
  @IsUrl({ protocols: ["https"], require_protocol: true })
  @MaxLength(500)
  repositoryUrl?: string;
  @IsOptional() @IsString() @MaxLength(200) branch?: string;
}
export class UpdateProjectDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120) name?: string;
  @IsOptional() @IsString() @MaxLength(600) description?: string;
  @IsOptional()
  @IsUrl({ protocols: ["https"], require_protocol: true })
  @MaxLength(500)
  repositoryUrl?: string;
  @IsOptional() @IsString() @MaxLength(200) branch?: string;
  @IsOptional()
  @IsIn(["PRIVATE", "ORGANIZATION", "PUBLIC_READONLY"])
  visibility?: "PRIVATE" | "ORGANIZATION" | "PUBLIC_READONLY";
}
