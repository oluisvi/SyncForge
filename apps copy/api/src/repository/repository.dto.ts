import { IsOptional, IsString, IsUrl, MaxLength } from "class-validator";
export class AnalyzeRepositoryDto {
  @IsUrl({ protocols: ["https"], require_protocol: true }) @MaxLength(500) repositoryUrl!: string;
  @IsOptional() @IsString() @MaxLength(200) branch?: string;
}
