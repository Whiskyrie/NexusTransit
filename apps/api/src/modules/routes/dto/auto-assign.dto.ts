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
    example: '2024-12-15',
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
  @ApiProperty({
    description: 'ID da rota atribuída',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  route_id!: string;

  @ApiProperty({
    description: 'Código da rota',
    example: 'RT-20241215-001',
  })
  route_code!: string;

  @ApiProperty({
    description: 'ID do motorista atribuído',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  driver_id!: string;

  @ApiProperty({
    description: 'Nome do motorista',
    example: 'João Silva',
  })
  driver_name!: string;

  @ApiProperty({
    description: 'ID do veículo atribuído',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  vehicle_id!: string;

  @ApiProperty({
    description: 'Placa do veículo',
    example: 'ABC-1234',
  })
  vehicle_plate!: string;

  @ApiProperty({
    description: 'Razão da atribuição automática',
    example: 'Motorista e veículo disponíveis com melhor compatibilidade',
  })
  assignment_reason!: string;

  @ApiProperty({
    description: 'Score de confiança da atribuição (0-100)',
    example: 95.5,
  })
  confidence_score!: number;
}
