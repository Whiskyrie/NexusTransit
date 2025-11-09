import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';
import { RouteStatus } from '../enums/route-status';
import { RouteType } from '../enums/route.type';

/**
 * DTO para parada da rota na resposta
 */
class RouteStopResponseDto {
  @ApiProperty({
    description: 'ID da parada',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'ID do endereço do cliente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  customer_address_id!: string;

  @ApiProperty({
    description: 'Ordem na sequência',
    example: 1,
  })
  sequence_order!: number;

  @ApiProperty({
    description: 'Status da parada',
    example: 'PENDING',
  })
  status!: string;

  @ApiProperty({
    description: 'Endereço completo',
    example: 'Rua A, 123 - Bairro, Cidade - UF',
  })
  address!: string;

  @ApiPropertyOptional({
    description: 'Horário planejado de chegada',
    example: '09:00',
  })
  planned_arrival_time?: string;

  @ApiPropertyOptional({
    description: 'Horário planejado de partida',
    example: '09:30',
  })
  planned_departure_time?: string;

  @ApiPropertyOptional({
    description: 'Horário real de chegada',
    example: '2024-01-15T09:05:00Z',
  })
  actual_arrival_time?: Date;

  @ApiPropertyOptional({
    description: 'Horário real de partida',
    example: '2024-01-15T09:35:00Z',
  })
  actual_departure_time?: Date;
}

/**
 * DTO para dados do veículo na resposta
 */
class VehicleResponseDto {
  @ApiProperty({ description: 'ID do veículo' })
  id!: string;

  @ApiProperty({ description: 'Placa do veículo' })
  license_plate!: string;

  @ApiProperty({ description: 'Marca' })
  brand!: string;

  @ApiProperty({ description: 'Modelo' })
  model!: string;

  @ApiProperty({ description: 'Tipo do veículo' })
  vehicle_type!: string;
}

/**
 * DTO para dados do motorista na resposta
 */
class DriverResponseDto {
  @ApiProperty({ description: 'ID do motorista' })
  id!: string;

  @ApiProperty({ description: 'Nome completo' })
  full_name!: string;

  @ApiProperty({ description: 'Email' })
  email!: string;

  @ApiProperty({ description: 'Telefone' })
  phone!: string;

  @ApiProperty({ description: 'CPF' })
  cpf!: string;
}

/**
 * DTO para resposta de rota
 */
export class RouteResponseDto {
  @ApiProperty({
    description: 'ID único da rota',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Código da rota',
    example: 'RT-20240115-001',
  })
  route_code!: string;

  @ApiProperty({
    description: 'Nome da rota',
    example: 'Rota Centro - Zona Sul',
  })
  name!: string;

  @ApiPropertyOptional({
    description: 'Descrição',
  })
  description?: string;

  @ApiProperty({
    description: 'Veículo',
    type: VehicleResponseDto,
  })
  vehicle!: VehicleResponseDto;

  @ApiProperty({
    description: 'Motorista',
    type: DriverResponseDto,
  })
  driver!: DriverResponseDto;

  @ApiProperty({
    description: 'Status',
    enum: RouteStatus,
  })
  status!: RouteStatus;

  @ApiProperty({
    description: 'Tipo',
    enum: RouteType,
  })
  type!: RouteType;

  @ApiProperty({
    description: 'Endereço de origem',
  })
  origin_address!: string;

  @ApiPropertyOptional({
    description: 'Coordenadas de origem',
  })
  origin_coordinates?: string;

  @ApiProperty({
    description: 'Endereço de destino',
  })
  destination_address!: string;

  @ApiPropertyOptional({
    description: 'Coordenadas de destino',
  })
  destination_coordinates?: string;

  @ApiProperty({
    description: 'Data planejada',
    example: '2024-01-15',
  })
  planned_date!: Date;

  @ApiPropertyOptional({
    description: 'Horário de início planejado',
  })
  planned_start_time?: string;

  @ApiPropertyOptional({
    description: 'Horário de término planejado',
  })
  planned_end_time?: string;

  @ApiPropertyOptional({
    description: 'Horário real de início',
  })
  actual_start_time?: Date;

  @ApiPropertyOptional({
    description: 'Horário real de término',
  })
  actual_end_time?: Date;

  @ApiPropertyOptional({
    description: 'Distância estimada em km',
  })
  estimated_distance_km?: number;

  @ApiPropertyOptional({
    description: 'Distância real em km',
  })
  actual_distance_km?: number;

  @ApiPropertyOptional({
    description: 'Duração estimada em minutos',
  })
  estimated_duration_minutes?: number;

  @ApiPropertyOptional({
    description: 'Duração real em minutos',
  })
  actual_duration_minutes?: number;

  @ApiPropertyOptional({
    description: 'Carga total em kg',
  })
  total_load_kg?: number;

  @ApiPropertyOptional({
    description: 'Volume total em m³',
  })
  total_volume_m3?: number;

  @ApiPropertyOptional({
    description: 'Nível de dificuldade (1-5)',
  })
  difficulty_level?: number;

  @ApiPropertyOptional({
    description: 'Observações',
  })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Paradas da rota',
    type: [RouteStopResponseDto],
  })
  @Type(() => RouteStopResponseDto)
  stops?: RouteStopResponseDto[];

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-15T10:00:00Z',
  })
  created_at!: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2024-01-15T14:00:00Z',
  })
  updated_at!: Date;

  @Exclude()
  deleted_at?: Date;
}
