import { IsEmail, IsString, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserType } from '../enums/user-type.enum';
import { UserStatus } from '../enums/user-status.enum';

export class CreateUserDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'admin@nexustransit.com',
    format: 'email',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Senha do usuário (mínimo 6 caracteres)',
    example: 'Admin@123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({
    description: 'Primeiro nome',
    example: 'Admin',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  first_name!: string;

  @ApiProperty({
    description: 'Sobrenome',
    example: 'User',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  last_name!: string;

  @ApiPropertyOptional({
    description: 'Telefone',
    example: '+5511999999999',
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
    default: UserType.CUSTOMER,
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
    description: 'Preferências do usuário (JSON)',
    example: { theme: 'dark', language: 'pt-BR' },
  })
  @IsOptional()
  preferences?: Record<string, unknown>;
}
