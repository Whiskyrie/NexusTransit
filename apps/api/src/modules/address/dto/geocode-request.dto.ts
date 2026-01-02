import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

/**
 * DTO para requisição de geocoding
 *
 * Usado no endpoint POST /addresses/geocode
 */
export class GeocodeRequestDto {
  @ApiProperty({
    description: 'Endereço completo a ser geocodificado',
    example: 'Av. Paulista, 1578, Bela Vista, São Paulo, SP',
    minLength: 5,
    maxLength: 500,
  })
  @IsNotEmpty()
  @IsString()
  @Length(5, 500)
  address!: string;
}

/**
 * DTO de resposta para geocoding
 */
export class GeocodeResponseDto {
  @ApiProperty({
    description: 'Latitude da coordenada',
    example: -23.5505,
  })
  latitude!: number;

  @ApiProperty({
    description: 'Longitude da coordenada',
    example: -46.6333,
  })
  longitude!: number;

  @ApiProperty({
    description: 'Endereço formatado pelo provedor',
    example: 'Av. Paulista, 1578 - Bela Vista, São Paulo - SP, 01310-200, Brasil',
  })
  formatted_address!: string;

  @ApiPropertyOptional({
    description: 'ID do local no provedor (Google Maps, etc)',
    example: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
  })
  place_id?: string;

  @ApiPropertyOptional({
    description: 'Tipos do local',
    type: [String],
    example: ['street_address', 'premise'],
  })
  types?: string[];

  @ApiPropertyOptional({
    description: 'Nível de precisão do resultado',
    example: 'ROOFTOP',
  })
  accuracy?: string;
}
