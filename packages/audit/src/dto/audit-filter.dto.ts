import {
  IsOptional,
  IsEnum,
  IsDateString,
  IsString,
  IsUUID,
  IsInt,
  Min,
  Max,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { AuditAction, AuditCategory } from "../enums";

export class AuditFilterDto {
  @ApiPropertyOptional({
    description: "Número da página",
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Itens por página",
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: "Filtrar por ação",
    enum: AuditAction,
    example: AuditAction.UPDATE,
  })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @ApiPropertyOptional({
    description: "Filtrar por categoria",
    enum: AuditCategory,
    example: AuditCategory.SYSTEM,
  })
  @IsOptional()
  @IsEnum(AuditCategory)
  category?: AuditCategory;

  @ApiPropertyOptional({
    description: "Filtrar por ID do usuário",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: "Filtrar por tipo de recurso/entidade",
    example: "Vehicle",
  })
  @IsOptional()
  @IsString()
  resourceType?: string;

  @ApiPropertyOptional({
    description: "Filtrar por ID do recurso",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsOptional()
  @IsString()
  resourceId?: string;

  @ApiPropertyOptional({
    description: "Data de início (ISO 8601)",
    example: "2024-01-01T00:00:00Z",
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: "Data de fim (ISO 8601)",
    example: "2024-12-31T23:59:59Z",
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: "Filtrar por endereço IP",
    example: "192.168.1.1",
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({
    description: "Busca textual em descrição e metadata",
    example: "alteração de status",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "Ordenar por campo",
    example: "created_at",
    enum: ["created_at", "action", "category", "resourceType"],
    default: "created_at",
  })
  @IsOptional()
  @IsString()
  sortBy?: string = "created_at";

  @ApiPropertyOptional({
    description: "Direção da ordenação",
    example: "DESC",
    enum: ["ASC", "DESC"],
    default: "DESC",
  })
  @IsOptional()
  @IsString()
  sortOrder?: "ASC" | "DESC" = "DESC";
}
