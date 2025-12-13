import { IsString, IsNotEmpty, IsEnum, IsInt, Min, IsOptional, IsBoolean } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { RateLimitStrategyType } from "../interfaces/rate-limit-strategy.interface";

export type RuleType = "GLOBAL" | "IP" | "USER" | "API_KEY" | "ENDPOINT";

/**
 * DTO para criar nova regra de rate limiting
 */
export class CreateRuleDto {
  @ApiProperty({
    description: "Tipo de rate limiting",
    enum: ["GLOBAL", "IP", "USER", "API_KEY", "ENDPOINT"],
    example: "USER",
  })
  @IsEnum(["GLOBAL", "IP", "USER", "API_KEY", "ENDPOINT"])
  @IsNotEmpty()
  type!: RuleType;

  @ApiProperty({
    description: "Estratégia de rate limiting",
    enum: ["SLIDING_WINDOW", "TOKEN_BUCKET", "FIXED_WINDOW"],
    example: "SLIDING_WINDOW",
  })
  @IsEnum(["SLIDING_WINDOW", "TOKEN_BUCKET", "FIXED_WINDOW"])
  @IsNotEmpty()
  strategy!: RateLimitStrategyType;

  @ApiProperty({
    description: "Número máximo de requests permitidos",
    example: 100,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  limit!: number;

  @ApiProperty({
    description: "Tamanho da janela de tempo em milissegundos",
    example: 60000,
    minimum: 1000,
  })
  @IsInt()
  @Min(1000)
  @IsNotEmpty()
  window_size!: number;

  @ApiProperty({
    description: "Prioridade da regra (menor número = maior prioridade)",
    example: 1,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  priority!: number;

  @ApiPropertyOptional({
    description: "Taxa de reabastecimento para Token Bucket (tokens por segundo)",
    example: 10,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  refill_rate?: number;

  @ApiPropertyOptional({
    description: "ID do role para rate limiting baseado em role",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsOptional()
  @IsString()
  role_id?: string;

  @ApiPropertyOptional({
    description: "Endpoint específico (para type=ENDPOINT)",
    example: "/api/users",
  })
  @IsOptional()
  @IsString()
  endpoint?: string;

  @ApiPropertyOptional({
    description: "ID da API Key (para type=API_KEY)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsOptional()
  @IsString()
  api_key_id?: string;

  @ApiPropertyOptional({
    description: "Se a regra está ativa",
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: "Descrição da regra",
    example: "Rate limit para usuários padrão",
  })
  @IsOptional()
  @IsString()
  description?: string;
}
