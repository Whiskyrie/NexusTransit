import { IsEmail, IsString, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserType } from '../enums/user-type.enum';
import { UserStatus } from '../enums/user-status.enum';

/**
 * DTO para criação de usuário
 */
export class CreateUserDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'usuario@empresa.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'Senha@123',
    minLength: 6,
    maxLength: 100,
  })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({
    description: 'Primeiro nome',
    example: 'João',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  first_name!: string;

  @ApiProperty({
    description: 'Sobrenome',
    example: 'Silva',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  last_name!: string;

  @ApiPropertyOptional({
    description: 'Telefone do usuário',
    example: '11999999999',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Tipo de usuário',
    enum: UserType,
    example: UserType.ADMIN,
  })
  @IsOptional()
  @IsEnum(UserType)
  user_type?: UserType;

  @ApiPropertyOptional({
    description: 'Status do usuário',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
    default: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Preferências do usuário',
    example: { theme: 'dark', language: 'pt-BR' },
  })
  @IsOptional()
  preferences?: Record<string, unknown>;
}
