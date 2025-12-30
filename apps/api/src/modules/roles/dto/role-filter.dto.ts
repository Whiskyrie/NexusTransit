import { IsOptional, IsEnum, IsBoolean, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BaseFilterDto } from '@nexus/common';
import { Role } from '@nexus/auth';

/**
 * DTO para Filtro de Roles
 *
 * Permite filtrar roles por diversos critérios
 */
export class RoleFilterDto extends BaseFilterDto {
  @ApiPropertyOptional({
    description: 'Filtrar por nome do role',
    example: 'admin',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de role',
    enum: Role,
    example: Role.ADMIN,
  })
  @IsOptional()
  @IsEnum(Role)
  type?: Role;

  @ApiPropertyOptional({
    description: 'Filtrar por status ativo',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar apenas roles do sistema',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_system?: boolean;
}
