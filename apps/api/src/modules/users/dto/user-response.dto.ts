import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { UserStatus } from '../enums/user-status.enum';
import { UserType } from '../enums/user-type.enum';

/**
 * DTO de resposta para usuário
 *
 * IMPORTANTE: Campos sensíveis são excluídos automaticamente
 * - password_hash
 * - reset_password_token
 * - reset_password_expires
 *
 * Usa class-transformer para controlar serialização
 */
export class UserResponseDto {
  @ApiProperty({
    description: 'ID único do usuário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'usuario@empresa.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Primeiro nome',
    example: 'João',
  })
  first_name!: string;

  @ApiProperty({
    description: 'Sobrenome',
    example: 'Silva',
  })
  last_name!: string;

  @ApiProperty({
    description: 'Nome completo (computed)',
    example: 'João Silva',
  })
  @Expose()
  get full_name(): string {
    return `${this.first_name} ${this.last_name}`.trim();
  }

  @ApiPropertyOptional({
    description: 'Telefone do usuário',
    example: '11999999999',
  })
  phone?: string;

  @ApiProperty({
    description: 'Tipo de usuário',
    enum: UserType,
    example: UserType.ADMIN,
  })
  user_type!: UserType;

  @ApiProperty({
    description: 'Status do usuário',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @ApiProperty({
    description: 'Email foi verificado',
    example: true,
  })
  email_verified!: boolean;

  @ApiPropertyOptional({
    description: 'Data de verificação do email',
    example: '2024-01-15T10:30:00Z',
  })
  email_verified_at?: Date;

  @ApiPropertyOptional({
    description: 'Último login',
    example: '2024-01-20T14:25:00Z',
  })
  last_login_at?: Date;

  @ApiPropertyOptional({
    description: 'Última atividade registrada',
    example: '2024-01-20T16:45:00Z',
  })
  last_activity_at?: Date;

  @ApiPropertyOptional({
    description: 'Preferências do usuário',
    example: { theme: 'dark', language: 'pt-BR' },
  })
  preferences?: Record<string, unknown>;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-01T00:00:00Z',
  })
  created_at!: Date;

  @ApiProperty({
    description: 'Data de última atualização',
    example: '2024-01-20T00:00:00Z',
  })
  updated_at!: Date;

  @ApiPropertyOptional({
    description: 'Data de exclusão (soft delete)',
    example: null,
  })
  deleted_at?: Date;

  // ============================================
  // CAMPOS EXCLUÍDOS (sensíveis/internos)
  // ============================================

  /**
   * Hash da senha - NUNCA deve ser exposto
   */
  @Exclude()
  password_hash?: string;

  /**
   * Token de reset de senha - NUNCA deve ser exposto
   */
  @Exclude()
  reset_password_token?: string;

  /**
   * Expiração do token - NUNCA deve ser exposta
   */
  @Exclude()
  reset_password_expires?: Date;

  // ============================================
  // Campos computados adicionais
  // ============================================

  @ApiProperty({
    description: 'Indica se usuário está ativo',
    example: true,
  })
  @Expose()
  get is_active(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  @ApiProperty({
    description: 'Indica se usuário pode fazer login',
    example: true,
  })
  @Expose()
  get can_login(): boolean {
    return this.is_active && this.email_verified;
  }
}
