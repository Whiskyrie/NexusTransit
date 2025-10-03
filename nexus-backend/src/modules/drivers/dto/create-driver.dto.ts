import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsEmail,
  IsDateString,
  MinLength,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DriverStatus } from '../enums/driver-status.enum';
import { CNHCategory } from '../enums/cnh-category.enum';
import { IsCPF } from '../validators/cpf.validator';
import { IsCNH } from '../validators/cnh.validator';

/**
 * DTO para criação de motorista
 */
export class CreateDriverDto {
  @ApiProperty({
    description: 'CPF do motorista (apenas números)',
    example: '12345678901',
    minLength: 11,
    maxLength: 11,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(11)
  @MaxLength(11)
  @IsCPF()
  cpf!: string;

  @ApiProperty({
    description: 'Nome completo do motorista',
    example: 'João da Silva',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  full_name!: string;

  @ApiProperty({
    description: 'Data de nascimento (YYYY-MM-DD)',
    example: '1990-01-15',
  })
  @IsDateString()
  birth_date!: string;

  @ApiProperty({
    description: 'Email do motorista',
    example: 'joao.silva@email.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Telefone/celular (apenas números)',
    example: '11999999999',
    minLength: 10,
    maxLength: 11,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(11)
  phone!: string;

  @ApiProperty({
    description: 'Número da CNH',
    example: '12345678901',
    minLength: 11,
    maxLength: 11,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(11)
  @MaxLength(11)
  @IsCNH()
  cnh_number!: string;

  @ApiProperty({
    description: 'Categoria da CNH',
    enum: CNHCategory,
    example: CNHCategory.B,
  })
  @IsEnum(CNHCategory)
  cnh_category!: CNHCategory;

  @ApiProperty({
    description: 'Data de validade da CNH (YYYY-MM-DD)',
    example: '2030-12-31',
  })
  @IsDateString()
  cnh_expiration_date!: string;

  @ApiProperty({
    description: 'Status do motorista',
    enum: DriverStatus,
    example: DriverStatus.AVAILABLE,
    required: false,
  })
  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;

  @ApiProperty({
    description: 'Indica se o motorista está ativo',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
