import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  IsNumber,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleType } from '../enums/role-type.enum';

/**
 * DTO para criação de role (papel/função)
 */
export class CreateRoleDto {
  @ApiProperty({
    description: 'Nome único do role',
    example: 'Administrador de Entregas',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    description: 'Descrição detalhada do role',
    example: 'Gerencia e supervisiona todas as operações de entrega',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({
    description: 'Tipo do role',
    enum: RoleType,
    example: RoleType.ADMIN,
  })
  @IsEnum(RoleType)
  type!: RoleType;

  @ApiPropertyOptional({
    description: 'Lista de permissões associadas ao role',
    example: ['deliveries.create', 'deliveries.update', 'deliveries.view'],
    isArray: true,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional({
    description: 'Nível hierárquico do role (menor = maior autoridade)',
    example: 1,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  hierarchy_level?: number;

  @ApiPropertyOptional({
    description: 'Indica se o role está ativo',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Configurações adicionais do role',
    example: { max_deliveries_per_day: 50, can_approve_exceptions: true },
  })
  @IsOptional()
  settings?: Record<string, unknown>;
}
