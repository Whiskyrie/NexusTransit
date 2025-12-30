import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsNumber,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para criação de role (papel/função)
 */
export class CreateRoleDto {
  @ApiProperty({
    description: 'Nome único do role',
    example: 'admin',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  name!: string;

  @ApiProperty({
    description: 'Nome de exibição do role',
    example: 'Administrador',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  display_name!: string;

  @ApiPropertyOptional({
    description: 'Descrição detalhada do role',
    example: 'Administrador com acesso total ao sistema',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({
    description: 'Nível hierárquico do role (0 = mais alto)',
    example: 1,
    minimum: 0,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  hierarchy_level?: number;

  @ApiPropertyOptional({
    description: 'Lista de permissões associadas ao role',
    example: ['users:read', 'users:write', 'roles:read'],
    isArray: true,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional({
    description: 'Indica se o role está ativo',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
