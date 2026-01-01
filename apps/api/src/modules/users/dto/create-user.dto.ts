import { IsEmail, IsString, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { UserType } from '../enums/user-type.enum';
import { UserStatus } from '../enums/user-status.enum';
import { IsStrongPassword } from '../validators/strong-password.validator';
import { IsUniqueEmail } from '../validators/unique-email.validator';
import { USER_CONSTANTS } from '../constants/user.constants';

/**
 * DTO para criação de usuário
 *
 * Validações implementadas:
 * - Email único no sistema
 * - Senha forte (requisitos de segurança)
 * - Normalização automática de email
 * - Limites de caracteres seguindo constantes do sistema
 */
export class CreateUserDto {
  @ApiProperty({
    description: 'Email único do usuário',
    example: 'usuario@empresa.com',
    maxLength: USER_CONSTANTS.EMAIL.MAX_LENGTH,
  })
  @IsEmail({}, { message: 'Email deve estar em formato válido' })
  @IsUniqueEmail({ message: 'Email já está em uso por outro usuário' })
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email!: string;

  @ApiProperty({
    description: `Senha forte do usuário (mínimo ${USER_CONSTANTS.PASSWORD.MIN_LENGTH} caracteres, incluindo maiúsculas, minúsculas, números e caracteres especiais)`,
    example: 'Senha@123',
    minLength: USER_CONSTANTS.PASSWORD.MIN_LENGTH,
    maxLength: USER_CONSTANTS.PASSWORD.MAX_LENGTH,
  })
  @IsString()
  @IsStrongPassword({
    message: `Senha deve ter entre ${USER_CONSTANTS.PASSWORD.MIN_LENGTH} e ${USER_CONSTANTS.PASSWORD.MAX_LENGTH} caracteres, incluindo maiúsculas, minúsculas, números e caracteres especiais`,
  })
  password!: string;

  @ApiProperty({
    description: 'Primeiro nome do usuário',
    example: 'João',
    minLength: USER_CONSTANTS.NAME.MIN_LENGTH,
    maxLength: USER_CONSTANTS.NAME.MAX_LENGTH,
  })
  @IsString()
  @MinLength(USER_CONSTANTS.NAME.MIN_LENGTH, {
    message: `Primeiro nome deve ter no mínimo ${USER_CONSTANTS.NAME.MIN_LENGTH} caracteres`,
  })
  @MaxLength(USER_CONSTANTS.NAME.MAX_LENGTH, {
    message: `Primeiro nome deve ter no máximo ${USER_CONSTANTS.NAME.MAX_LENGTH} caracteres`,
  })
  @Transform(({ value }: { value: string }) => value?.trim())
  first_name!: string;

  @ApiProperty({
    description: 'Sobrenome do usuário',
    example: 'Silva',
    minLength: USER_CONSTANTS.NAME.MIN_LENGTH,
    maxLength: USER_CONSTANTS.NAME.MAX_LENGTH,
  })
  @IsString()
  @MinLength(USER_CONSTANTS.NAME.MIN_LENGTH, {
    message: `Sobrenome deve ter no mínimo ${USER_CONSTANTS.NAME.MIN_LENGTH} caracteres`,
  })
  @MaxLength(USER_CONSTANTS.NAME.MAX_LENGTH, {
    message: `Sobrenome deve ter no máximo ${USER_CONSTANTS.NAME.MAX_LENGTH} caracteres`,
  })
  @Transform(({ value }: { value: string }) => value?.trim())
  last_name!: string;

  @ApiPropertyOptional({
    description: 'Telefone do usuário (apenas números)',
    example: '11999999999',
    maxLength: USER_CONSTANTS.PHONE.MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(USER_CONSTANTS.PHONE.MAX_LENGTH, {
    message: `Telefone deve ter no máximo ${USER_CONSTANTS.PHONE.MAX_LENGTH} caracteres`,
  })
  @Transform(({ value }: { value: string }) => value?.replace(/\D/g, '')) // Remove caracteres não numéricos
  phone?: string;

  @ApiPropertyOptional({
    description: 'Tipo de usuário no sistema',
    enum: UserType,
    example: UserType.CUSTOMER,
    default: UserType.CUSTOMER,
  })
  @IsOptional()
  @IsEnum(UserType, { message: 'Tipo de usuário inválido' })
  user_type?: UserType;

  @ApiPropertyOptional({
    description: 'Status inicial do usuário',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
    default: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus, { message: 'Status de usuário inválido' })
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Preferências personalizadas do usuário (JSON)',
    example: { theme: 'dark', language: 'pt-BR', notifications: true },
  })
  @IsOptional()
  preferences?: Record<string, unknown>;
}
