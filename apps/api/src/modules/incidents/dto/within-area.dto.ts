import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, ValidateNested, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { IncidentStatus } from '../enums/incident.enums';

/**
 * Classe auxiliar para coordenadas de um ponto
 */
export class Coordinate {
  @ApiProperty({
    description: 'Latitude',
    example: -23.5505,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({
    description: 'Longitude',
    example: -46.6333,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;
}

/**
 * DTO para buscar incidentes dentro de uma área (polígono)
 */
export class WithinAreaDto {
  @ApiProperty({
    description: 'Array de coordenadas que formam o polígono da área',
    type: [Coordinate],
    example: [
      { latitude: -23.5505, longitude: -46.6333 },
      { latitude: -23.5605, longitude: -46.6333 },
      { latitude: -23.5605, longitude: -46.6233 },
      { latitude: -23.5505, longitude: -46.6233 },
      { latitude: -23.5505, longitude: -46.6333 },
    ],
    minItems: 4,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Coordinate)
  coordinates!: Coordinate[];

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
    example: 100,
    default: 100,
    minimum: 1,
    maximum: 500,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  @Type(() => Number)
  limit?: number = 100;
}
