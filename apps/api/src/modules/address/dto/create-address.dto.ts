import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Length,
  Matches,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsCEP } from '@nexus/common';

/**
 * DTO para criação de endereço
 */
export class CreateAddressDto {
  @ApiPropertyOptional({
    description: 'CEP do endereço (formato: 00000-000 ou 00000000)',
    example: '01001-000',
    minLength: 8,
    maxLength: 9,
  })
  @IsOptional()
  @IsString()
  @IsCEP()
  cep?: string;

  @ApiProperty({
    description: 'Logradouro/rua do endereço',
    example: 'Praça da Sé',
    minLength: 2,
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @Length(2, 255)
  street: string;

  @ApiPropertyOptional({
    description: 'Número do endereço',
    example: '123',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  number?: string;

  @ApiPropertyOptional({
    description: 'Complemento do endereço',
    example: 'Apto 45',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  complement?: string;

  @ApiProperty({
    description: 'Bairro do endereço',
    example: 'Sé',
    minLength: 2,
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @Length(2, 100)
  neighborhood: string;

  @ApiProperty({
    description: 'Cidade do endereço',
    example: 'São Paulo',
    minLength: 2,
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @Length(2, 100)
  city: string;

  @ApiProperty({
    description: 'Estado do endereço (UF)',
    example: 'SP',
    minLength: 2,
    maxLength: 2,
  })
  @IsNotEmpty()
  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Z]{2}$/, {
    message: 'Estado deve conter exatamente 2 letras maiúsculas',
  })
  @Transform(({ value }: { value: string }) => value?.toUpperCase())
  state: string;

  @ApiPropertyOptional({
    description: 'País do endereço',
    example: 'Brasil',
    default: 'Brasil',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  country?: string;

  @ApiPropertyOptional({
    description: 'Latitude do endereço',
    example: -23.55052,
    minimum: -90,
    maximum: 90,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude do endereço',
    example: -46.633308,
    minimum: -180,
    maximum: 180,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Código do IBGE da cidade',
    example: '3550308',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  ibge_code?: string;

  @ApiPropertyOptional({
    description: 'Código GIA',
    example: '1004',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  gia_code?: string;

  @ApiPropertyOptional({
    description: 'DDD da região',
    example: '11',
    minLength: 2,
    maxLength: 10,
  })
  @IsOptional()
  @IsString()
  @Length(2, 10)
  ddd?: string;

  @ApiPropertyOptional({
    description: 'Código SIAFI',
    example: '7107',
    maxLength: 10,
  })
  @IsOptional()
  @IsString()
  @Length(1, 10)
  siafi_code?: string;

  @ApiPropertyOptional({
    description: 'Indica se o endereço está ativo',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Observações sobre o endereço',
    example: 'Portão azul',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  notes?: string;
}
