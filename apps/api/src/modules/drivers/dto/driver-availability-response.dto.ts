import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { AvailabilityType } from '../enums/availability-type.enum';

/**
 * DTO de resposta para disponibilidade/ausência de motorista
 */
export class DriverAvailabilityResponseDto {
  @ApiProperty({
    description: 'ID único do registro',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'ID do motorista',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  driver_id!: string;

  @ApiProperty({
    description: 'Tipo de disponibilidade/ausência',
    enum: AvailabilityType,
    example: AvailabilityType.VACATION,
  })
  availability_type!: AvailabilityType;

  @ApiProperty({
    description: 'Data de início do período',
    example: '2024-01-01',
    type: 'string',
    format: 'date',
  })
  start_date!: Date;

  @ApiProperty({
    description: 'Data de término do período',
    example: '2024-01-15',
    type: 'string',
    format: 'date',
  })
  end_date!: Date;

  @ApiPropertyOptional({
    description: 'Motivo da indisponibilidade',
    example: 'Férias anuais programadas',
  })
  reason?: string;

  @ApiPropertyOptional({
    description: 'Observações adicionais',
    example: 'Motorista solicitou período com antecedência',
  })
  notes?: string;

  @ApiProperty({
    description: 'Status do registro',
    example: true,
  })
  is_active!: boolean;

  @ApiProperty({
    description: 'Indica se foi aprovado',
    example: true,
  })
  is_approved!: boolean;

  @ApiPropertyOptional({
    description: 'ID do usuário que aprovou',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  approved_by?: string;

  @ApiPropertyOptional({
    description: 'Data/hora da aprovação',
    example: '2024-01-01T00:00:00Z',
  })
  @Type(() => Date)
  approved_at?: Date;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-01T00:00:00Z',
  })
  @Type(() => Date)
  created_at!: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2024-01-01T00:00:00Z',
  })
  @Type(() => Date)
  updated_at!: Date;

  @ApiPropertyOptional({
    description: 'Duração em dias',
    example: 15,
  })
  @Expose()
  duration_days?: number;

  @ApiPropertyOptional({
    description: 'Status do período (current, future, past)',
    example: 'current',
    enum: ['current', 'future', 'past'],
  })
  @Expose()
  period_status?: 'current' | 'future' | 'past';
}
