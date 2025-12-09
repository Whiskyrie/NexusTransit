import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

/**
 * User Response DTO
 * DTO para dados do usuário sem informações sensíveis
 */
export class UserResponseDto {
  @ApiProperty({
    description: 'ID único do usuário',
    example: 'b7af2f88-4a8e-4c6a-9b5d-7f3e8c9d2a1b',
  })
  id!: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'admin@nexustransit.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Silva',
  })
  full_name!: string;

  @ApiProperty({
    description: 'Roles do usuário',
    example: ['admin', 'gestor'],
    isArray: true,
  })
  roles!: string[];

  @ApiProperty({
    description: 'Permissões do usuário',
    example: ['users:create', 'users:read', 'vehicles:read'],
    isArray: true,
  })
  permissions!: string[];

  @ApiProperty({
    description: 'Email foi verificado',
    example: true,
  })
  email_verified!: boolean;

  static fromUser(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      roles: user.roles?.map(role => role.name) ?? [],
      permissions: user.roles?.flatMap(role => role.permissions ?? []) ?? [],
      email_verified: user.email_verified,
    };
  }
}
