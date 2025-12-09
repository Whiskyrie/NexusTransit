import { IsOptional, IsString, IsEmail, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseFilterDto } from '../../../common/dto/base-filter.dto';
import { AuthProvider } from '../enums/auth-provider.enum';

/**
 * Auth Filter DTO
 *
 * Data Transfer Object para filtros de autenticação.
 * Utilizado em endpoints de listagem e relatórios.
 *
 * **Filtros Disponíveis:**
 * - `email`: Filtra por email do usuário
 * - `provider`: Filtra por provedor de autenticação
 * - `created_at`: Filtra por data de criação
 * - `updated_at`: Filtra por data de atualização
 */
export class AuthFilterDto extends BaseFilterDto {
  @ApiPropertyOptional({
    description: 'Filtrar por email do usuário',
    example: 'usuario@empresa.com',
  })
  @IsOptional()
  @IsString({ message: 'Email deve ser uma string' })
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por provedor de autenticação',
    enum: AuthProvider,
    example: AuthProvider.LOCAL,
  })
  @IsOptional()
  @IsEnum(AuthProvider, { message: 'Provedor inválido' })
  provider?: AuthProvider;

  @ApiPropertyOptional({
    description: 'Filtrar usuários criados a partir desta data',
    example: '2024-01-01',
    format: 'date',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data deve ter formato válido' })
  created_at?: string;

  @ApiPropertyOptional({
    description: 'Filtrar usuários atualizados a partir desta data',
    example: '2024-01-01',
    format: 'date',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data deve ter formato válido' })
  updated_at?: string;
}
