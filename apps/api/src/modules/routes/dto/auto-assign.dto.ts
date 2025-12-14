import { IsUUID, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para requisição de atribuição automática de motorista e veículo
 *
 * Permite especificar data da rota ou usar a data atual
 */
export class AutoAssignDto {
  @ApiProperty({
    description: 'ID da rota para atribuir motorista e veículo',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
    format: 'uuid',
  })
  @IsUUID()
  route_id!: string;

  @ApiPropertyOptional({
    description: 'Data da rota (se não informado, usa a data da rota existente)',
    example: '2024-01-15',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  route_date?: string;
}

/**
 * DTO para resposta de atribuição automática
 */
export class AutoAssignResponseDto {
  route_id!: string;
  route_code!: string;
  driver_id!: string;
  driver_name!: string;
  vehicle_id!: string;
  vehicle_plate!: string;
  assignment_reason!: string;
  confidence_score!: number;
}
