import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  ValidateNested,
  IsArray,
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

/**
 * DTO para criação de cliente
 */
export class CreateCustomerDto {
  @ApiProperty({
    description: 'CPF ou CNPJ do cliente (apenas números)',
    example: '43380928828',
    minLength: 11,
    maxLength: 14,
  })
  @IsCpfCnpj()
  @IsNotEmpty()
  taxId!: string;

  @ApiProperty({
    description: 'Nome completo ou razão social do cliente',
    example: 'João Silva',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Email do cliente',
    example: 'joao.silva@email.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: 'Telefone brasileiro (apenas números)',
    example: '11999999999',
    minLength: 10,
    maxLength: 11,
  })
  @IsBrazilianPhone()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({
    description: 'Tipo de cliente',
    enum: CustomerType,
    example: CustomerType.INDIVIDUAL,
  })
  @IsEnum(CustomerType)
  @IsNotEmpty()
  type!: CustomerType;

  @ApiPropertyOptional({
    description: 'Status do cliente',
    enum: CustomerStatus,
    example: CustomerStatus.ACTIVE,
    default: CustomerStatus.ACTIVE,
  })
  @IsEnum(CustomerStatus)
  @IsOptional()
  status?: CustomerStatus;

  @ApiPropertyOptional({
    description: 'Categoria do cliente',
    enum: CustomerCategory,
    example: CustomerCategory.STANDARD,
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
    description: 'Metadados adicionais do cliente',
    example: { origem: 'website', referencia: 'campanha123' },
  })
  @IsOptional()
  metadata?: Record<string, unknown>;
}
