import { IsOptional, IsEnum, IsBoolean } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { BaseFilterDto } from "@nexus/common";
import { RateLimitStrategyType } from "../interfaces/rate-limit-strategy.interface";

/**
 * DTO para filtrar regras de rate limiting
 */
export class RuleFilterDto extends BaseFilterDto {
  @ApiPropertyOptional({
    description: "Filtrar por tipo de regra",
    enum: ["GLOBAL", "IP", "USER", "API_KEY", "ENDPOINT"],
  })
  @IsOptional()
  @IsEnum(["GLOBAL", "IP", "USER", "API_KEY", "ENDPOINT"])
  type?: string;

  @ApiPropertyOptional({
    description: "Filtrar por estratégia",
    enum: ["SLIDING_WINDOW", "TOKEN_BUCKET", "FIXED_WINDOW"],
  })
  @IsOptional()
  @IsEnum(["SLIDING_WINDOW", "TOKEN_BUCKET", "FIXED_WINDOW"])
  strategy?: RateLimitStrategyType;

  @ApiPropertyOptional({
    description: "Filtrar por status ativo/inativo",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: "Filtrar por role ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsOptional()
  role_id?: string;

  @ApiPropertyOptional({
    description: "Filtrar por endpoint",
    example: "/api/users",
  })
  @IsOptional()
  endpoint?: string;
}
