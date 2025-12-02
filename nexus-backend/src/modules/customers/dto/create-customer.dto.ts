import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerType } from '../enums/customer-type.enum';
import { CustomerStatus } from '../enums/customer-status.enum';
import { CustomerCategory } from '../enums/customer-category.enum';
import { CreateCustomerAddressDto } from './create-customer-address.dto';
import { CreateCustomerContactDto } from './create-customer-contact.dto';
import { CreateCustomerPreferencesDto } from './create-customer-preferences.dto';
import { IsCpfCnpj } from '../validators/is-cpf-cnpj.validator';
import { IsBrazilianPhone } from '../validators/is-brazilian-phone.validator';

export class CreateCustomerDto {
  @ApiProperty({
    description: 'CPF (11 dígitos) ou CNPJ (14 dígitos) do cliente',
    example: '12345678901',
    minLength: 11,
    maxLength: 14,
  })
  @IsCpfCnpj()
  @IsNotEmpty()
  taxId!: string;

  @ApiProperty({
    description: 'Nome completo do cliente (pessoa física) ou razão social (pessoa jurídica)',
    example: 'João Silva',
    minLength: 2,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Email de contato do cliente',
    example: 'joao.silva@email.com',
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: 'Telefone de contato principal (formato brasileiro)',
    example: '11987654321',
    pattern: '^[0-9]{10,11}$',
  })
  @IsBrazilianPhone()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({
    description: 'Tipo do cliente',
    enum: CustomerType,
    example: CustomerType.INDIVIDUAL,
    enumName: 'CustomerType',
  })
  @IsEnum(CustomerType)
  @IsNotEmpty()
  type!: CustomerType;

  @ApiPropertyOptional({
    description: 'Status do cliente',
    enum: CustomerStatus,
    example: CustomerStatus.ACTIVE,
    default: CustomerStatus.ACTIVE,
    enumName: 'CustomerStatus',
  })
  @IsEnum(CustomerStatus)
  @IsOptional()
  status?: CustomerStatus;

  @ApiPropertyOptional({
    description: 'Categoria do cliente',
    enum: CustomerCategory,
    example: CustomerCategory.STANDARD,
    default: CustomerCategory.STANDARD,
    enumName: 'CustomerCategory',
  })
  @IsEnum(CustomerCategory)
  @IsOptional()
  category?: CustomerCategory;

  @ApiPropertyOptional({
    description: 'Lista de endereços do cliente',
    type: [CreateCustomerAddressDto],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCustomerAddressDto)
  addresses?: CreateCustomerAddressDto[];

  @ApiPropertyOptional({
    description: 'Lista de contatos adicionais do cliente',
    type: [CreateCustomerContactDto],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCustomerContactDto)
  contacts?: CreateCustomerContactDto[];

  @ApiPropertyOptional({
    description: 'Preferências do cliente',
    type: CreateCustomerPreferencesDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateCustomerPreferencesDto)
  preferences?: CreateCustomerPreferencesDto;

  @ApiPropertyOptional({
    description: 'Metadados adicionais do cliente (campos personalizados)',
    example: { origem: 'indicacao', observacoes: 'Cliente preferencial' },
  })
  @IsOptional()
  metadata?: Record<string, unknown>;
}
