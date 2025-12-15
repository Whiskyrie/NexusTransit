import { IsOptional, IsDateString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO para requisição de sugestão de rotas
 *
 * Permite filtrar entregas por data e limitar número de rotas sugeridas
 */
export class SuggestRoutesDto {
  @ApiPropertyOptional({
    description: 'Data para qual criar as rotas sugeridas (formato ISO 8601)',
    example: '2024-12-15',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  target_date?: string;

  @ApiPropertyOptional({
    description: 'Número máximo de rotas a sugerir',
    example: 5,
    minimum: 1,
    maximum: 20,
    default: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(20)
  max_routes?: number = 5;

  @ApiPropertyOptional({
    description: 'Número máximo de paradas por rota',
    example: 15,
    minimum: 1,
    maximum: 50,
    default: 15,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  max_stops_per_route?: number = 15;
}

/**
 * DTO para coordenadas geográficas
 */
export class GeoCoordinatesDto {
  @ApiProperty({
    description: 'Latitude do ponto',
    example: -23.5505,
  })
  latitude!: number;

  @ApiProperty({
    description: 'Longitude do ponto',
    example: -46.6333,
  })
  longitude!: number;
}

/**
 * DTO para resposta de rota sugerida
 */
export class SuggestedRouteDto {
  @ApiProperty({
    description: 'Código sugerido para a rota',
    example: 'ROTA-SUG-001',
  })
  suggested_route_code!: string;

  @ApiProperty({
    description: 'IDs das entregas incluídas na rota',
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
    type: [String],
  })
  delivery_ids!: string[];

  @ApiProperty({
    description: 'Distância total estimada em quilômetros',
    example: 25.5,
  })
  estimated_distance_km!: number;

  @ApiProperty({
    description: 'Duração total estimada em minutos',
    example: 120,
  })
  estimated_duration_minutes!: number;

  @ApiProperty({
    description: 'Número de entregas na rota',
    example: 8,
  })
  estimated_deliveries!: number;

  @ApiProperty({
    description: 'Score de otimização da rota (0-100)',
    example: 85.5,
  })
  optimization_score!: number;

  @ApiPropertyOptional({
    description: 'Coordenadas de início da rota',
    type: GeoCoordinatesDto,
  })
  start_location?: GeoCoordinatesDto;

  @ApiPropertyOptional({
    description: 'Coordenadas de fim da rota',
    type: GeoCoordinatesDto,
  })
  end_location?: GeoCoordinatesDto;
}

/**
 * DTO para resposta de múltiplas rotas sugeridas
 */
export class SuggestRoutesResponseDto {
  @ApiProperty({
    description: 'Lista de rotas sugeridas',
    type: [SuggestedRouteDto],
  })
  suggested_routes!: SuggestedRouteDto[];

  @ApiProperty({
    description: 'Total de sugestões geradas',
    example: 3,
  })
  total_suggestions!: number;

  @ApiProperty({
    description: 'Total de entregas cobertas pelas sugestões',
    example: 25,
  })
  total_deliveries_covered!: number;

  @ApiProperty({
    description: 'Entregas pendentes não incluídas nas sugestões',
    example: 5,
  })
  pending_deliveries!: number;
}
