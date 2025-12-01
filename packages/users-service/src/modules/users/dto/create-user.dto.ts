import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';
import { UserType } from '../enums/user-type.enum';
import { UserStatus } from '../enums/user-status.enum';

/**
 * Create User DTO
 * Mantém fidelidade total com o monólito
 */
export class CreateUserDto {
  @ApiProperty({
    description: 'Email único do usuário',
    example: 'user@nexustransit.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Senha do usuário (mínimo 6 caracteres)',
    example: 'SecurePass123!',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({
    description: 'Primeiro nome do usuário',
    example: 'João',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  first_name!: string;

  @ApiProperty({
    description: 'Sobrenome do usuário',
    example: 'Silva',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  last_name!: string;

  @ApiPropertyOptional({
    description: 'Telefone do usuário',
    example: '+5511999887766',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Tipo de usuário no sistema',
    enum: UserType,
    example: UserType.CUSTOMER,
  })
  @IsOptional()
  @IsEnum(UserType)
  user_type?: UserType;

  @ApiPropertyOptional({
    description: 'Status do usuário',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Preferências personalizadas do usuário',
    example: { theme: 'dark', notifications: true },
  })
  @IsOptional()
  preferences?: Record<string, unknown>;
}
