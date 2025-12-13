import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para solicitar recuperação de senha
 */
export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email do usuário que esqueceu a senha',
    example: 'usuario@nexustransit.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email!: string;
}
