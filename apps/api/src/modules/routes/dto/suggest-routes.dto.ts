import { IsOptional, IsDateString, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO para requisição de sugestão de rotas
 *
 * Permite filtrar entregas por data e limitar número de rotas sugeridas
 */
export class SuggestRoutesDto {
  @ApiPropertyOptional({
    description: 'Data para qual criar as rotas sugeridas',
    example: '2024-01-15',
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
 * DTO para resposta de rota sugerida
 */
export class SuggestedRouteDto {
  suggested_route_code!: string;
  delivery_ids!: string[];
  estimated_distance_km!: number;
  estimated_duration_minutes!: number;
  estimated_deliveries!: number;
  optimization_score!: number;
  start_location?: {
    latitude: number;
    longitude: number;
  };
  end_location?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * DTO para resposta de múltiplas rotas sugeridas
 */
export class SuggestRoutesResponseDto {
  suggested_routes!: SuggestedRouteDto[];
  total_suggestions!: number;
  total_deliveries_covered!: number;
  pending_deliveries!: number;
}
