import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO de resposta para estatísticas de rastreamento
 *
 * Fornece resumo de métricas de uma rota ou período
 */
export class TrackingStatsDto {
  @ApiProperty({
    description: 'Total de pontos registrados',
    example: 150,
  })
  total_points!: number;

  @ApiProperty({
    description: 'Distância total percorrida (em km)',
    example: 125.5,
  })
  total_distance!: number;

  @ApiProperty({
    description: 'Tempo total (em minutos)',
    example: 180,
  })
  total_time!: number;

  @ApiProperty({
    description: 'Velocidade média (em km/h)',
    example: 65.3,
  })
  average_speed!: number;

  @ApiProperty({
    description: 'Velocidade máxima (em km/h)',
    example: 110.0,
  })
  max_speed!: number;

  @ApiPropertyOptional({
    description: 'Total de paradas',
    example: 3,
  })
  total_stops?: number;

  @ApiPropertyOptional({
    description: 'Tempo total de paradas (em minutos)',
    example: 45,
  })
  total_stop_time?: number;

  @ApiProperty({
    description: 'Data/hora do primeiro ponto',
    example: '2024-01-15T08:00:00Z',
  })
  first_point_at!: Date;

  @ApiProperty({
    description: 'Data/hora do último ponto',
    example: '2024-01-15T11:00:00Z',
  })
  last_point_at!: Date;

  @ApiPropertyOptional({
    description: 'Primeira localização',
    example: { latitude: -23.55052, longitude: -46.633308, address: 'São Paulo, SP' },
  })
  first_location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };

  @ApiPropertyOptional({
    description: 'Última localização',
    example: { latitude: -23.56452, longitude: -46.654308, address: 'São Paulo, SP' },
  })
  last_location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };

  @ApiPropertyOptional({
    description: 'Pontos inválidos',
    example: 2,
  })
  invalid_points?: number;

  @ApiPropertyOptional({
    description: 'Precisão média (em metros)',
    example: 12.5,
  })
  average_accuracy?: number;

  @ApiPropertyOptional({
    description: 'Zonas visitadas',
    example: ['Centro', 'Zona Sul', 'Zona Oeste'],
  })
  zones_visited?: string[];

  @ApiPropertyOptional({
    description: 'Cidades visitadas',
    example: ['São Paulo', 'Guarulhos'],
  })
  cities_visited?: string[];
}

/**
 * DTO para solicitar estatísticas de rastreamento
 */
export class TrackingStatsRequestDto {
  @ApiProperty({
    description: 'ID da entrega',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  delivery_id?: string;

  @ApiProperty({
    description: 'ID do veículo',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  vehicle_id?: string;

  @ApiProperty({
    description: 'ID do motorista',
    example: '123e4567-e89b-12d3-a456-426614174002',
    required: false,
  })
  driver_id?: string;

  @ApiPropertyOptional({
    description: 'Data de início',
    example: '2024-01-01T00:00:00Z',
  })
  start_date?: string;

  @ApiPropertyOptional({
    description: 'Data de fim',
    example: '2024-01-31T23:59:59Z',
  })
  end_date?: string;
}
