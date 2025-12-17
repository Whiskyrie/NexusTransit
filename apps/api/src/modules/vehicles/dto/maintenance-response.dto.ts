import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MaintenanceType, MaintenanceStatus } from '../enums';
import { PartUsedDto } from './parts-used.dto';
import { ServicePerformedDto } from './service-performed.dto';

export class MaintenanceResponseDto {
  @ApiProperty({
    description: 'ID único da manutenção',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: 'Tipo de manutenção',
    enum: MaintenanceType,
    example: MaintenanceType.PREVENTIVE,
  })
  maintenance_type!: MaintenanceType;

  @ApiProperty({
    description: 'Título ou resumo da manutenção',
    example: 'Revisão dos 10.000 km',
  })
  title!: string;

  @ApiProperty({
    description: 'Descrição detalhada dos serviços realizados',
    example: 'Troca de óleo, filtro de óleo e verificação geral',
  })
  description!: string;

  @ApiProperty({
    description: 'Data em que a manutenção foi realizada ou agendada',
    example: '2023-12-15T00:00:00.000Z',
  })
  maintenance_date!: Date;

  @ApiProperty({
    description: 'Quilometragem do veículo no momento da manutenção',
    example: 10000,
  })
  mileage_at_maintenance!: number;

  @ApiProperty({
    description: 'Status da manutenção',
    enum: MaintenanceStatus,
    example: MaintenanceStatus.COMPLETED,
  })
  status!: MaintenanceStatus;

  @ApiProperty({
    description: 'Data de criação',
    example: '2023-12-15T00:00:00.000Z',
  })
  created_at!: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2023-12-15T00:00:00.000Z',
  })
  updated_at!: Date;

  @ApiPropertyOptional({
    description: 'Nome da oficina ou prestador de serviço',
    example: 'AutoCenter LTDA',
  })
  service_provider?: string;

  @ApiPropertyOptional({
    description: 'Telefone de contato do prestador de serviço',
    example: '(11) 98765-4321',
  })
  service_provider_contact?: string;

  @ApiPropertyOptional({
    description: 'Endereço do local onde foi realizada a manutenção',
    example: 'Rua das Flores, 123',
  })
  service_location?: string;

  @ApiPropertyOptional({
    description: 'Data programada para a próxima manutenção deste tipo',
    example: '2024-06-15T00:00:00.000Z',
  })
  next_maintenance_date?: Date;

  @ApiPropertyOptional({
    description: 'Quilometragem prevista para a próxima manutenção',
    example: 20000,
  })
  next_maintenance_mileage?: number;

  @ApiPropertyOptional({
    description: 'Número da ordem de serviço ou nota fiscal',
    example: 'OS-2023-1234',
  })
  service_order_number?: string;

  @ApiPropertyOptional({
    description: 'Garantia oferecida pelo serviço',
    example: '6 meses ou 10.000 km',
  })
  warranty_period?: string;

  @ApiPropertyOptional({
    description: 'Data de expiração da garantia do serviço',
    example: '2024-06-15T00:00:00.000Z',
  })
  warranty_expiry_date?: Date;

  @ApiPropertyOptional({
    description: 'Lista de peças utilizadas na manutenção',
    type: [PartUsedDto],
  })
  parts_used?: PartUsedDto[];

  @ApiPropertyOptional({
    description: 'Lista de serviços realizados',
    type: [ServicePerformedDto],
  })
  services_performed?: ServicePerformedDto[];

  @ApiPropertyOptional({
    description: 'Observações adicionais sobre a manutenção',
    example: 'Veículo apresentou ruído no motor',
  })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Data de início da manutenção',
    example: '2023-12-15T00:00:00.000Z',
  })
  start_date?: Date;

  @ApiPropertyOptional({
    description: 'Data de conclusão da manutenção',
    example: '2023-12-15T00:00:00.000Z',
  })
  completion_date?: Date;

  @ApiPropertyOptional({
    description: 'Avaliação da qualidade do serviço (0-5 estrelas)',
    example: 5,
  })
  service_rating?: number;

  @ApiPropertyOptional({
    description: 'Comentários sobre a avaliação do serviço',
    example: 'Serviço excelente, entregue no prazo',
  })
  rating_comments?: string;
}
