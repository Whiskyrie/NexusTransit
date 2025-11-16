import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Refresh Token DTO
 *
 * Data Transfer Object para renovação de tokens de acesso.
 * Utilizado para obter um novo access_token usando um refresh_token válido.
 *
 * **Fluxo de Renovação:**
 * 1. Cliente envia refresh_token válido
 * 2. Sistema valida o refresh_token
 * 3. Sistema gera novo access_token e refresh_token
 * 4. Sistema invalida o refresh_token antigo
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'Token de refresh JWT válido',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.refresh_signature_here',
    minLength: 10,
  })
  @IsString({ message: 'Refresh token deve ser uma string' })
  @IsNotEmpty({ message: 'Refresh token é obrigatório' })
  @MinLength(10, { message: 'Refresh token inválido' })
  refresh_token!: string;
}
