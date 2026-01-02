import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

/**
 * DTO para requisição de reverse geocoding
 *
 * Usado no endpoint POST /addresses/reverse-geocode
 */
export class ReverseGeocodeRequestDto {
  @ApiProperty({
    description: 'Latitude da coordenada',
    example: -23.5505,
    minimum: -90,
    maximum: 90,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({
    description: 'Longitude da coordenada',
    example: -46.6333,
    minimum: -180,
    maximum: 180,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;
}

/**
 * DTO de resposta para reverse geocoding
 */
export class ReverseGeocodeResponseDto {
  @ApiProperty({
    description: 'Endereço formatado completo',
    example: 'Av. Paulista, 1578 - Bela Vista, São Paulo - SP, 01310-200, Brasil',
  })
  formatted_address!: string;

  @ApiPropertyOptional({
    description: 'Logradouro',
    example: 'Avenida Paulista',
  })
  street?: string;

  @ApiPropertyOptional({
    description: 'Número',
    example: '1578',
  })
  number?: string;

  @ApiPropertyOptional({
    description: 'Bairro',
    example: 'Bela Vista',
  })
  neighborhood?: string;

  @ApiPropertyOptional({
    description: 'Cidade',
    example: 'São Paulo',
  })
  city?: string;

  @ApiPropertyOptional({
    description: 'Estado (sigla UF)',
    example: 'SP',
  })
  state?: string;

  @ApiPropertyOptional({
    description: 'País',
    example: 'Brasil',
  })
  country?: string;

  @ApiPropertyOptional({
    description: 'CEP',
    example: '01310-200',
  })
  postal_code?: string;
}
