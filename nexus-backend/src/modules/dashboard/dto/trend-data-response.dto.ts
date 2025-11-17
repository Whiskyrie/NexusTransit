import { ApiProperty } from '@nestjs/swagger';
import { TrendData } from '../interfaces/dashboard-metrics.interface';

/**
 * DTO de resposta para dados de tendência/gráficos
 */
export class TrendDataResponseDto {
  @ApiProperty({
    description: 'Período de análise',
    example: 'LAST_30_DAYS',
  })
  period!: string;

  @ApiProperty({
    description: 'Nome da métrica',
    example: 'deliveries',
  })
  metric_name!: string;

  @ApiProperty({
    description: 'Dados da série temporal',
    type: 'array',
    example: [
      { label: '01/11', value: 45, date: '2024-11-01T00:00:00Z' },
      { label: '02/11', value: 52, date: '2024-11-02T00:00:00Z' },
    ],
  })
  data!: TrendData[];

  @ApiProperty({
    description: 'Valor total no período',
    example: 1250,
  })
  total!: number;

  @ApiProperty({
    description: 'Valor médio',
    example: 41.7,
  })
  average!: number;

  @ApiProperty({
    description: 'Valor mínimo',
    example: 28,
  })
  min!: number;

  @ApiProperty({
    description: 'Valor máximo',
    example: 68,
  })
  max!: number;

  @ApiProperty({
    description: 'Tendência (crescimento, decrescimento, estável)',
    example: 'crescimento',
    enum: ['crescimento', 'decrescimento', 'estável'],
  })
  trend!: string;

  @ApiProperty({
    description: 'Percentual de mudança em relação ao período anterior',
    example: 15.3,
  })
  change_percentage!: number;
}
