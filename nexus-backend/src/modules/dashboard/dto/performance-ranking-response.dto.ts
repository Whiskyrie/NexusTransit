import { ApiProperty } from '@nestjs/swagger';
import { PerformanceRanking } from '../interfaces/dashboard-metrics.interface';

/**
 * DTO de resposta para ranking de performance
 */
export class PerformanceRankingResponseDto {
  @ApiProperty({
    description: 'Tipo de ranking',
    example: 'top_drivers',
    enum: ['top_drivers', 'top_vehicles', 'top_routes'],
  })
  ranking_type!: string;

  @ApiProperty({
    description: 'Período de análise',
    example: 'LAST_30_DAYS',
  })
  period!: string;

  @ApiProperty({
    description: 'Ranking ordenado',
    type: 'array',
    example: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'João Silva',
        score: 98.5,
        rank: 1,
        metadata: { deliveries: 125, on_time_rate: 98.5 },
      },
    ],
  })
  ranking!: PerformanceRanking[];

  @ApiProperty({
    description: 'Métrica utilizada para o ranking',
    example: 'deliveries_count',
  })
  metric!: string;
}
