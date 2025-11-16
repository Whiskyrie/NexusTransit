import { ApiProperty } from '@nestjs/swagger';
import { CategoryDistribution } from '../interfaces/dashboard-metrics.interface';

/**
 * DTO de resposta para distribuição por categorias
 */
export class CategoryDistributionResponseDto {
  @ApiProperty({
    description: 'Nome da métrica',
    example: 'deliveries_by_status',
  })
  metric_name!: string;

  @ApiProperty({
    description: 'Total de itens',
    example: 1250,
  })
  total!: number;

  @ApiProperty({
    description: 'Distribuição por categoria',
    type: 'array',
    example: [
      { category: 'COMPLETED', count: 1100, percentage: 88.0, color: '#10b981' },
      { category: 'PENDING', count: 80, percentage: 6.4, color: '#f59e0b' },
      { category: 'IN_PROGRESS', count: 50, percentage: 4.0, color: '#3b82f6' },
      { category: 'CANCELLED', count: 20, percentage: 1.6, color: '#ef4444' },
    ],
  })
  distribution!: CategoryDistribution[];
}
