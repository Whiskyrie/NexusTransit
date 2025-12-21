import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IncidentResponseDto } from './incident-response.dto';

/**
 * DTO de resposta para incidentes com informações de distância
 */
export class IncidentWithDistanceDto extends IncidentResponseDto {
  @ApiProperty({
    description: 'Distância do ponto de referência em metros',
    example: 1234.56,
  })
  distance_meters!: number;

  @ApiPropertyOptional({
    description: 'Distância formatada de forma legível',
    example: '1.23 km',
  })
  distance_formatted?: string;
}
