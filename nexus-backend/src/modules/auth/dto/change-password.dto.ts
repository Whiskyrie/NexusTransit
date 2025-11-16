import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Change Password DTO
 *
 * Data Transfer Object para alteração de senha de usuários autenticados.
 * Utilizado quando o usuário deseja alterar sua senha atual.
 *
 * **Fluxo de Alteração:**
 * 1. Usuário fornece senha atual
 * 2. Sistema valida senha atual
 * 3. Usuário fornece nova senha
 * 4. Sistema atualiza senha
 * 5. Sistema invalida todos os tokens ativos
 */
export class ChangePasswordDto {
  @ApiProperty({
    description: 'Senha atual do usuário',
    example: 'SenhaAntiga123!',
    minLength: 8,
    maxLength: 128,
  })
  @IsString({ message: 'Senha atual deve ser uma string' })
  @IsNotEmpty({ message: 'Senha atual é obrigatória' })
  @MinLength(8, { message: 'Senha atual deve ter pelo menos 8 caracteres' })
  @MaxLength(128, { message: 'Senha atual deve ter no máximo 128 caracteres' })
  current_password!: string;

  @ApiProperty({
    description: 'Nova senha do usuário',
    example: 'NovaSenhaForte456!',
    minLength: 8,
    maxLength: 128,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]',
  })
  @IsString({ message: 'Nova senha deve ser uma string' })
  @IsNotEmpty({ message: 'Nova senha é obrigatória' })
  @MinLength(8, { message: 'Nova senha deve ter pelo menos 8 caracteres' })
  @MaxLength(128, { message: 'Nova senha deve ter no máximo 128 caracteres' })
  new_password!: string;

  @ApiProperty({
    description: 'Confirmação da nova senha',
    example: 'NovaSenhaForte456!',
    minLength: 8,
    maxLength: 128,
  })
  @IsString({ message: 'Confirmação de nova senha deve ser uma string' })
  @IsNotEmpty({ message: 'Confirmação de nova senha é obrigatória' })
  @MinLength(8, { message: 'Confirmação de nova senha deve ter pelo menos 8 caracteres' })
  @MaxLength(128, { message: 'Confirmação de nova senha deve ter no máximo 128 caracteres' })
  confirm_new_password!: string;
}
