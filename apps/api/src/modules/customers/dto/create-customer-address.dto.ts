import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  ValidateIf,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AddressType } from '../enums/address-type.enum';
import { IsCep } from '../validators/is-cep.validator';

/**
 * DTO para criação de endereço de cliente
 */
export class CreateCustomerAddressDto {
  @ApiProperty({
    description: 'Nome da rua/avenida',
    example: 'Rua das Flores',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  street!: string;

  @ApiProperty({
    description: 'Número do endereço',
    example: '123',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  number!: string;

  @ApiPropertyOptional({
    description: 'Complemento do endereço',
    example: 'Apto 45',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  complement?: string;

  @ApiProperty({
    description: 'Bairro',
    example: 'Centro',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  neighborhood!: string;

  @ApiProperty({
    description: 'CEP brasileiro (apenas números)',
    example: '01310100',
    minLength: 8,
    maxLength: 8,
  })
  @IsCep()
  @IsNotEmpty()
  zipCode!: string;

  @ApiProperty({
    description: 'Cidade',
    example: 'São Paulo',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({
    description: 'Estado (sigla UF)',
    example: 'SP',
    minLength: 2,
    maxLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  state!: string;

  @ApiPropertyOptional({
    description: 'Latitude geográfica',
    example: -23.5505,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @IsOptional()
  @ValidateIf((o: CreateCustomerAddressDto) => o.latitude !== undefined)
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude geográfica',
    example: -46.6333,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @IsOptional()
  @ValidateIf((o: CreateCustomerAddressDto) => o.longitude !== undefined)
  @Type(() => Number)
  longitude?: number;

  @ApiProperty({
    description: 'Tipo de endereço',
    enum: AddressType,
    example: AddressType.COMMERCIAL,
  })
  @IsEnum(AddressType)
  @IsNotEmpty()
  type!: AddressType;

  @ApiPropertyOptional({
    description: 'Define se é o endereço principal',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({
    description: 'Define se o endereço está ativo',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Metadados adicionais do endereço',
    example: { referencia: 'Próximo ao mercado' },
  })
  @IsOptional()
  metadata?: Record<string, unknown>;
}
