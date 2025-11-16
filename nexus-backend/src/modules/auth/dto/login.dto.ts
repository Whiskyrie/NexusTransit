import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Login DTO
 *
 * Data Transfer Object para autenticação de usuários.
 * Define a estrutura dos dados necessários para realizar login no sistema.
 *
 * **Campos Obrigatórios:**
 * - `email`: Endereço de email válido do usuário
 * - `password`: Senha forte seguindo os requisitos de segurança
 */
export class LoginDto {
  @ApiProperty({
    description: 'Email do usuário para autenticação',
    example: 'usuario@empresa.com',
    format: 'email',
    minLength: 5,
    maxLength: 255,
  })
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  @MinLength(5, { message: 'Email deve ter pelo menos 5 caracteres' })
  @MaxLength(255, { message: 'Email deve ter no máximo 255 caracteres' })
  email!: string;

  @ApiProperty({
    description: 'Senha do usuário para autenticação',
    example: 'SenhaForte123!',
    minLength: 8,
    maxLength: 128,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]',
  })
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  @MaxLength(128, { message: 'Senha deve ter no máximo 128 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Senha deve conter ao menos: 1 minúscula, 1 maiúscula, 1 número e 1 caractere especial',
  })
  password!: string;
}
