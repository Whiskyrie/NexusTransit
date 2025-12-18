import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TravelMode {
  DRIVING = 'driving',
  WALKING = 'walking',
  BICYCLING = 'bicycling',
  TRANSIT = 'transit',
}

/**
 * DTO para cálculo de distância entre endereços
 */
export class CalculateDistanceDto {
  @ApiProperty({
    description: 'Endereço de origem',
    example: 'Praça da Sé, São Paulo, SP',
  })
  @IsNotEmpty()
  @IsString()
  origin!: string;

  @ApiProperty({
    description: 'Endereço de destino',
    example: 'Avenida Paulista, 1578, São Paulo, SP',
  })
  @IsNotEmpty()
  @IsString()
  destination!: string;

  @ApiPropertyOptional({
    description: 'Modo de viagem',
    enum: TravelMode,
    example: TravelMode.DRIVING,
    default: TravelMode.DRIVING,
  })
  @IsOptional()
  @IsEnum(TravelMode)
  mode?: TravelMode;
}
