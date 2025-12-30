import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

/**
 * DTO de Resposta de Permissão
 *
 * Formata os dados de permissão para resposta da API
 */
@Exclude()
export class PermissionResponseDto {
  @ApiProperty({
    description: 'ID único da permissão',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'Nome único da permissão (ex: users:create)',
    example: 'users:read',
  })
  @Expose()
  name!: string;

  @ApiProperty({
    description: 'Recurso ao qual a permissão se aplica',
    example: 'users',
  })
  @Expose()
  resource!: string;

  @ApiProperty({
    description: 'Ação permitida (create, read, update, delete)',
    example: 'read',
  })
  @Expose()
  action!: string;

  @ApiProperty({
    description: 'Nome de exibição da permissão',
    example: 'Ler usuários',
  })
  @Expose()
  display_name!: string;

  @ApiPropertyOptional({
    description: 'Descrição da permissão',
    example: 'Permite visualizar informações de usuários',
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Se a permissão está ativa',
    example: true,
  })
  @Expose()
  is_active!: boolean;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-01T00:00:00Z',
  })
  @Expose()
  created_at!: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2024-01-01T00:00:00Z',
  })
  @Expose()
  updated_at!: Date;

  @ApiPropertyOptional({
    description: 'Data de deleção (soft delete)',
    example: '2024-01-01T00:00:00Z',
  })
  @Expose()
  deleted_at?: Date | null;
}
