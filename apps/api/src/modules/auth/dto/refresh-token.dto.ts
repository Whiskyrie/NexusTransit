import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para renovação de token
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token válido',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty({ message: 'Refresh token é obrigatório' })
  refresh_token!: string;
}
