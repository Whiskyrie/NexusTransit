import { IsNotEmpty, IsString, IsEnum, IsOptional, IsNumber, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AddressType } from '../enums/address-type.enum';
import { IsCep } from '../validators/is-cep.validator';

export class CreateCustomerAddressDto {
  @ApiProperty({
    description: 'Nome da rua/avenida',
    example: 'Av. Paulista',
    minLength: 2,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  street!: string;

  @ApiProperty({
    description: 'Número do endereço',
    example: '1578',
  })
  @IsString()
  @IsNotEmpty()
  number!: string;

  @ApiPropertyOptional({
    description: 'Complemento do endereço (apto, sala, etc)',
    example: 'Apto 123',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  complement?: string;

  @ApiProperty({
    description: 'Bairro',
    example: 'Bela Vista',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  neighborhood!: string;

  @ApiProperty({
    description: 'CEP (Código de Endereçamento Postal)',
    example: '01310-100',
    pattern: '^[0-9]{5}-?[0-9]{3}$',
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
    description: 'Latitude do endereço (coordenada geográfica)',
    example: -23.561414,
    type: 'number',
  })
  @IsNumber()
  @IsOptional()
  @ValidateIf((o: CreateCustomerAddressDto) => o.latitude !== undefined)
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude do endereço (coordenada geográfica)',
    example: -46.656139,
    type: 'number',
  })
  @IsNumber()
  @IsOptional()
  @ValidateIf((o: CreateCustomerAddressDto) => o.longitude !== undefined)
  @Type(() => Number)
  longitude?: number;

  @ApiProperty({
    description: 'Tipo do endereço',
    enum: AddressType,
    example: AddressType.RESIDENTIAL,
    enumName: 'AddressType',
  })
  @IsEnum(AddressType)
  @IsNotEmpty()
  type!: AddressType;

  @ApiPropertyOptional({
    description: 'Indica se é o endereço principal',
    example: true,
    default: false,
  })
  @IsOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional({
    description: 'Indica se o endereço está ativo',
    example: true,
    default: true,
  })
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Metadados adicionais do endereço',
    example: { referencia: 'Próximo ao metrô' },
  })
  @IsOptional()
  metadata?: Record<string, unknown>;
}
