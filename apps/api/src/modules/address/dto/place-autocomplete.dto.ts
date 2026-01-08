import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber, Min } from 'class-validator';

/**
 * DTO para requisição de autocomplete de lugares
 */
export class PlaceAutocompleteRequestDto {
  @ApiProperty({
    description: 'Texto de busca para autocomplete',
    example: 'Avenida Paulista',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty({ message: 'O texto de busca é obrigatório' })
  input: string;

  @ApiPropertyOptional({
    description: 'Tipos de lugares a buscar (address, establishment, geocode, etc)',
    example: ['address'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  types?: string[];

  @ApiPropertyOptional({
    description: 'Código do país para restringir resultados (ISO 3166-1 Alpha-2)',
    example: 'br',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    description: 'Latitude para priorizar resultados próximos',
    example: -23.55052,
  })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({
    description: 'Longitude para priorizar resultados próximos',
    example: -46.633308,
  })
  @IsOptional()
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({
    description: 'Raio em metros para busca (requer lat/lng)',
    example: 50000,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  radius?: number;
}

/**
 * DTO para predição individual do autocomplete
 */
export class PlaceAutocompletePredictionDto {
  @ApiProperty({
    description: 'Descrição completa do lugar',
    example: 'Avenida Paulista, São Paulo - SP, Brasil',
  })
  description: string;

  @ApiProperty({
    description: 'ID único do lugar no Google Maps',
    example: 'ChIJAQAAQOBXzpQRjNVmkS2R6TU',
  })
  place_id: string;

  @ApiProperty({
    description: 'Formatação estruturada da predição',
  })
  structured_formatting: {
    main_text: string;
    secondary_text: string;
    main_text_matched_substrings: {
      offset: number;
      length: number;
    }[];
  };

  @ApiProperty({
    description: 'Tipos de lugar (ex: route, political, locality)',
    example: ['route'],
    type: [String],
  })
  types: string[];

  @ApiProperty({
    description: 'Termos do endereço',
  })
  terms: {
    offset: number;
    value: string;
  }[];
}

/**
 * DTO para resposta de autocomplete
 */
export class PlaceAutocompleteResponseDto {
  @ApiProperty({
    description: 'Lista de predições encontradas',
    type: [PlaceAutocompletePredictionDto],
  })
  predictions: PlaceAutocompletePredictionDto[];

  @ApiProperty({
    description: 'Status da requisição',
    example: 'OK',
    enum: ['OK', 'ZERO_RESULTS', 'INVALID_REQUEST', 'REQUEST_DENIED'],
  })
  status: string;
}

/**
 * DTO para requisição de detalhes do lugar
 */
export class PlaceDetailsRequestDto {
  @ApiProperty({
    description: 'ID do lugar obtido do autocomplete',
    example: 'ChIJAQAAQOBXzpQRjNVmkS2R6TU',
  })
  @IsString()
  @IsNotEmpty({ message: 'O place_id é obrigatório' })
  placeId: string;
}

/**
 * DTO para resposta de detalhes do lugar
 */
export class PlaceDetailsResponseDto {
  @ApiProperty({
    description: 'Endereço formatado completo',
    example: 'Av. Paulista, 1578 - Bela Vista, São Paulo - SP, 01310-200, Brasil',
  })
  formatted_address: string;

  @ApiProperty({
    description: 'Coordenadas geográficas',
  })
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };

  @ApiProperty({
    description: 'Componentes do endereço',
  })
  address_components: {
    long_name: string;
    short_name: string;
    types: string[];
  }[];

  @ApiProperty({
    description: 'ID do lugar',
    example: 'ChIJAQAAQOBXzpQRjNVmkS2R6TU',
  })
  place_id: string;

  @ApiProperty({
    description: 'Tipos do lugar',
    example: ['route'],
    type: [String],
  })
  types: string[];
}
