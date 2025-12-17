import { ApiProperty } from '@nestjs/swagger';

export class AlertSummaryDto {
  @ApiProperty({
    description: 'Número total de veículos com alertas',
    example: 5,
  })
  totalVehiclesWithAlerts!: number;

  @ApiProperty({
    description: 'Número de veículos com manutenção urgente (próximos 7 dias)',
    example: 2,
  })
  urgentMaintenances!: number;

  @ApiProperty({
    description: 'Número de veículos com manutenção próxima (próximos 30 dias)',
    example: 3,
  })
  upcomingMaintenances!: number;

  @ApiProperty({
    description: 'Número de documentos próximos ao vencimento (próximos 30 dias)',
    example: 8,
  })
  expiringDocuments!: number;

  @ApiProperty({
    description: 'Número de documentos vencidos',
    example: 2,
  })
  expiredDocuments!: number;

  @ApiProperty({
    description: 'Número de veículos com seguro próximo ao vencimento',
    example: 1,
  })
  expiringInsurance!: number;

  @ApiProperty({
    description: 'Número de veículos com licenciamento próximo ao vencimento',
    example: 3,
  })
  expiringLicenses!: number;

  @ApiProperty({
    description: 'Nível de criticidade geral (low, medium, high, critical)',
    example: 'medium',
  })
  severityLevel!: 'low' | 'medium' | 'high' | 'critical';

  @ApiProperty({
    description: 'Data da última verificação',
    example: '2023-12-17T10:30:00.000Z',
  })
  lastChecked!: Date;
}
