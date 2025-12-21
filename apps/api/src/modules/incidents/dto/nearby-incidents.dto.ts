import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { IncidentStatus } from '../enums/incident.enums';

/**
 * DTO para buscar incidentes próximos a uma localização
 */
export class NearbyIncidentsDto {
  @ApiProperty({
    description: 'Latitude da localização de referência',
    example: -23.5505,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  latitude!: number;

  @ApiProperty({
    description: 'Longitude da localização de referência',
    example: -46.6333,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitude!: number;

  @ApiPropertyOptional({
    description: 'Raio de busca em metros',
    example: 5000,
    default: 5000,
    minimum: 100,
    maximum: 50000,
  })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(50000)
  @Type(() => Number)
  radius_meters?: number = 5000;

  @ApiPropertyOptional({
    description: 'Filtrar por status do incidente',
    enum: IncidentStatus,
    example: IncidentStatus.REPORTED,
  })
  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;

  @ApiPropertyOptional({
    description: 'Limite de resultados',
    example: 50,
    default: 50,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 50;
}
