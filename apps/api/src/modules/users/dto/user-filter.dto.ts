import { IsOptional, IsEnum, IsDateString, IsBoolean, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UserStatus } from '../enums/user-status.enum';
import { UserType } from '../enums/user-type.enum';

/**
 * DTO para filtrar usuários
 *
 * Estende funcionalidades de paginação e busca
 */
export class UserFilterDto {
  @ApiPropertyOptional({
    description: 'Busca por nome ou email',
    example: 'João Silva',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por status do usuário',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de usuário',
    enum: UserType,
    example: UserType.ADMIN,
  })
  @IsOptional()
  @IsEnum(UserType)
  user_type?: UserType;

  @ApiPropertyOptional({
    description: 'Filtrar por email verificado',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  email_verified?: boolean;

  @ApiPropertyOptional({
    description: 'Data de criação após (formato ISO)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  created_after?: string;

  @ApiPropertyOptional({
    description: 'Data de criação antes (formato ISO)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  created_before?: string;

  @ApiPropertyOptional({
    description: 'Número da página',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Itens por página',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Campo para ordenação',
    example: 'created_at',
    default: 'created_at',
    enum: ['created_at', 'updated_at', 'email', 'first_name', 'last_name', 'status'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['created_at', 'updated_at', 'email', 'first_name', 'last_name', 'status'])
  sort_by?: string = 'created_at';

  @ApiPropertyOptional({
    description: 'Ordem de classificação',
    example: 'DESC',
    default: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sort_order?: 'ASC' | 'DESC' = 'DESC';
}
