import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, Max, Length } from 'class-validator';
import { IsCEP } from '@nexus/common';
import { IsBrazilianState } from '../validators';

/**
 * DTO para validação de endereço
 *
 * Usado no endpoint POST /addresses/validate
 */
export class ValidateAddressDto {
  @ApiPropertyOptional({
    description: 'CEP do endereço',
    example: '12345-678',
    minLength: 8,
    maxLength: 10,
  })
  @IsOptional()
  @IsString()
  @IsCEP()
  cep?: string;

  @ApiPropertyOptional({
    description: 'Logradouro (rua, avenida, etc)',
    example: 'Rua das Flores',
    minLength: 2,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @Length(2, 200)
  street?: string;

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
    description: 'Bairro',
    example: 'Centro',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  neighborhood?: string;

  @ApiPropertyOptional({
    description: 'Cidade',
    example: 'São Paulo',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  city?: string;

  @ApiPropertyOptional({
    description: 'Estado (sigla UF)',
    example: 'SP',
    minLength: 2,
    maxLength: 2,
  })
  @IsOptional()
  @IsString()
  @IsBrazilianState()
  state?: string;

  @ApiPropertyOptional({
    description: 'Latitude',
    example: -23.5505,
    minimum: -90,
    maximum: 90,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude',
    example: -46.6333,
    minimum: -180,
    maximum: 180,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}

/**
 * DTO de resposta para validação de endereço
 */
export class ValidateAddressResponseDto {
  @ApiProperty({
    description: 'Indica se o endereço é válido',
    example: true,
  })
  is_valid!: boolean;

  @ApiProperty({
    description: 'Lista de erros encontrados na validação',
    type: [String],
    example: ['CEP deve conter exatamente 8 dígitos numéricos'],
  })
  errors!: string[];

  @ApiPropertyOptional({
    description: 'Lista de avisos (não impedem uso do endereço)',
    type: [String],
    example: ['Coordenadas não fornecidas'],
  })
  warnings?: string[];
}
