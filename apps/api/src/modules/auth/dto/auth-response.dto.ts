import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

/**
 * DTO de resposta de autenticação
 */
export class AuthResponseDto {
  @ApiProperty({
    description: 'Token de acesso JWT',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token!: string;

  @ApiProperty({
    description: 'Token de renovação',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refresh_token!: string;

  @ApiProperty({
    description: 'Tipo do token',
    example: 'Bearer',
    default: 'Bearer',
  })
  token_type = 'Bearer';

  @ApiProperty({
    description: 'Tempo de expiração do access token em segundos',
    example: 900,
  })
  expires_in!: number;

  @ApiProperty({
    description: 'Dados do usuário autenticado',
    type: () => UserPayloadDto,
  })
  user!: UserPayloadDto;
}

/**
 * DTO com dados do usuário no payload
 */
export class UserPayloadDto {
  @ApiProperty({
    description: 'ID do usuário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'usuario@nexustransit.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Silva',
  })
  full_name!: string;

  @ApiProperty({
    description: 'Tipo de usuário',
    example: 'DRIVER',
  })
  user_type!: string;

  @ApiProperty({
    description: 'Roles do usuário',
    example: ['user', 'driver'],
    type: [String],
  })
  roles!: string[];

  @Exclude()
  password_hash?: string;
}

/**
 * DTO de resposta para operações bem-sucedidas sem dados
 */
export class MessageResponseDto {
  @ApiProperty({
    description: 'Mensagem de sucesso',
    example: 'Operação realizada com sucesso',
  })
  message!: string;
}
