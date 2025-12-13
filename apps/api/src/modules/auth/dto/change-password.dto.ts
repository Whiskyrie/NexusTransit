import { IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para mudança de senha
 */
export class ChangePasswordDto {
  @ApiProperty({
    description: 'Senha atual do usuário',
    example: 'SenhaAntiga@123',
  })
  @IsString()
  @IsNotEmpty({ message: 'Senha atual é obrigatória' })
  current_password!: string;

  @ApiProperty({
    description: 'Nova senha do usuário',
    example: 'SenhaNova@123',
    minLength: 8,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'Nova senha é obrigatória' })
  @MinLength(8, { message: 'Nova senha deve ter no mínimo 8 caracteres' })
  @MaxLength(100, { message: 'Nova senha deve ter no máximo 100 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/, {
    message: 'Nova senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais',
  })
  new_password!: string;
}
