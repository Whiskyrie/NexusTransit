import { IsString, IsNotEmpty, MinLength, MaxLength, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Register DTO
 *
 * Data Transfer Object para registro de novos usuários.
 * Define a estrutura dos dados necessários para criar uma conta no sistema.
 *
 * **Campos Obrigatórios:**
 * - `email`: Endereço de email único e válido
 * - `password`: Senha forte seguindo requisitos de segurança
 * - `full_name`: Nome completo do usuário
 * - `confirm_password`: Confirmação da senha
 */
export class RegisterDto {
  @ApiProperty({
    description: 'Email do usuário para registro',
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
    description: 'Nome completo do usuário',
    example: 'João Silva',
    minLength: 3,
    maxLength: 100,
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MinLength(3, { message: 'Nome deve ter pelo menos 3 caracteres' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  full_name!: string;

  @ApiProperty({
    description: 'Senha do usuário para registro',
    example: 'SenhaForte123!',
    minLength: 8,
    maxLength: 128,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]',
  })
  @IsString({ message: 'Senha deve ser uma string' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  @MaxLength(128, { message: 'Senha deve ter no máximo 128 caracteres' })
  password!: string;

  @ApiProperty({
    description: 'Confirmação da senha do usuário',
    example: 'SenhaForte123!',
    minLength: 8,
    maxLength: 128,
  })
  @IsString({ message: 'Confirmação de senha deve ser uma string' })
  @IsNotEmpty({ message: 'Confirmação de senha é obrigatória' })
  @MinLength(8, { message: 'Confirmação de senha deve ter pelo menos 8 caracteres' })
  @MaxLength(128, { message: 'Confirmação de senha deve ter no máximo 128 caracteres' })
  confirm_password!: string;
}
