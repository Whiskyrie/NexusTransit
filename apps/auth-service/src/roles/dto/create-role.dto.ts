import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  IsNumber,
  MaxLength,
  MinLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleType } from '../enums/role-type.enum';

/**
 * Create Role DTO
 *
 * Data Transfer Object para criação de papéis (roles) no sistema.
 * Papéis definem permissões e hierarquia de acesso.
 */
export class CreateRoleDto {
  @ApiProperty({
    description: 'Nome único do papel',
    example: 'Gerente de Operações',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    description: 'Descrição detalhada do papel e suas responsabilidades',
    example: 'Gerencia operações diárias, supervisiona motoristas e aprova entregas',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({
    description: 'Tipo do papel no sistema',
    enum: RoleType,
    example: RoleType.MANAGER,
    enumName: 'RoleType',
  })
  @IsEnum(RoleType)
  type!: RoleType;

  @ApiPropertyOptional({
    description: 'Lista de permissões atribuídas ao papel',
    example: ['users:read', 'deliveries:read', 'deliveries:write', 'reports:read'],
    type: [String],
    isArray: true,
    default: [],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional({
    description: 'Nível hierárquico (0 = maior autoridade)',
    example: 1,
    minimum: 0,
    maximum: 10,
    default: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  hierarchy_level?: number;

  @ApiPropertyOptional({
    description: 'Papel está ativo e pode ser atribuído',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Configurações personalizadas do papel',
    example: {
      dashboard_access: true,
      max_deliveries_per_day: 50,
      notification_preferences: ['email', 'sms']
    },
  })
  @IsOptional()
  settings?: Record<string, unknown>;
}
