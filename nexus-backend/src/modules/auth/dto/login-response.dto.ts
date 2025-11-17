import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

/**
 * Login Response DTO
 *
 * Data Transfer Object para resposta de autenticação bem-sucedida.
 * Contém os tokens JWT e informações do usuário autenticado.
 *
 * **Estrutura da Resposta:**
 * - `access_token`: Token JWT para autenticação em requisições subsequentes
 * - `refresh_token`: Token JWT para renovar o access_token quando expirar
 * - `token_type`: Tipo do token (sempre "Bearer" no NexusTransit)
 * - `expires_in`: Tempo em segundos até a expiração do access_token
 * - `user`: Informações do usuário autenticado (sem dados sensíveis)
 */
export class LoginResponseDto {
  @ApiProperty({
    description: 'Token de accesso JWT (JSON Web Token)',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    minLength: 10,
  })
  access_token!: string;

  @ApiProperty({
    description: 'Token de refresh JWT para renovação do access token',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.different_signature_here',
    minLength: 10,
  })
  refresh_token!: string;

  @ApiProperty({
    description: 'Tipo do token de autorização',
    example: 'Bearer',
    default: 'Bearer',
    enum: ['Bearer'],
  })
  token_type!: string;

  @ApiProperty({
    description: 'Tempo de expiração do access token em segundos',
    example: 3600,
    minimum: 300,
    maximum: 86400,
  })
  expires_in!: number;

  @ApiProperty({
    description: 'Informações do usuário autenticado',
    type: () => UserResponseDto,
  })
  user!: UserResponseDto;
}
