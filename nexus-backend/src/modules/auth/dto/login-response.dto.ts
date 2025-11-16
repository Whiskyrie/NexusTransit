import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

/**
 * Login Response DTO
 * DTO de resposta para autenticação bem-sucedida
 */
export class LoginResponseDto {
  @ApiProperty({
    description: 'Token de acesso JWT',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token!: string;

  @ApiProperty({
    description: 'Token de refresh JWT',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refresh_token!: string;

  @ApiProperty({
    description: 'Tipo do token',
    example: 'Bearer',
    default: 'Bearer',
  })
  token_type!: string;

  @ApiProperty({
    description: 'Tempo de expiração do access token em segundos',
    example: 900,
  })
  expires_in!: number;

  @ApiProperty({
    description: 'Dados do usuário autenticado',
    type: () => UserResponseDto,
  })
  user!: UserResponseDto;
}
