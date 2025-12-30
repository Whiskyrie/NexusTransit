import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

/**
 * DTO de Resposta de Role
 *
 * Formata os dados de role para resposta da API
 */
@Exclude()
export class RoleResponseDto {
  @ApiProperty({
    description: 'ID único do role',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'Nome único do role',
    example: 'admin',
  })
  @Expose()
  name!: string;

  @ApiProperty({
    description: 'Nome de exibição do role',
    example: 'Administrador',
  })
  @Expose()
  display_name!: string;

  @ApiPropertyOptional({
    description: 'Descrição do role',
    example: 'Administrador com acesso total ao sistema',
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Nível hierárquico (0 = mais alto)',
    example: 1,
  })
  @Expose()
  hierarchy_level!: number;

  @ApiProperty({
    description: 'Lista de permissões do role',
    example: ['users:read', 'users:write', 'roles:read'],
    type: [String],
  })
  @Expose()
  permissions!: string[];

  @ApiProperty({
    description: 'Se o role está ativo',
    example: true,
  })
  @Expose()
  is_active!: boolean;

  @ApiPropertyOptional({
    description: 'Se o role é do sistema (não pode ser deletado)',
    example: false,
  })
  @Expose()
  is_system?: boolean;

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
  deleted_at?: Date;
}
