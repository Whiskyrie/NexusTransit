import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { RouteStatus } from '../enums/route-status';
import { RouteType } from '../enums/route.type';

/**
 * DTO básico para dados do veículo na resposta
 */
export class VehicleBasicDto {
  @ApiProperty({
    description: 'ID único do veículo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'Placa do veículo',
    example: 'ABC-1234',
  })
  @Expose()
  license_plate!: string;

  @ApiProperty({
    description: 'Marca do veículo',
    example: 'Volkswagen',
  })
  @Expose()
  brand!: string;

  @ApiProperty({
    description: 'Modelo do veículo',
    example: 'Delivery Express',
  })
  @Expose()
  model!: string;

  @ApiProperty({
    description: 'Tipo do veículo',
    example: 'VUC',
  })
  @Expose()
  vehicle_type!: string;
}

/**
 * DTO básico para dados do motorista na resposta
 */
export class DriverBasicDto {
  @ApiProperty({
    description: 'ID único do motorista',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'Nome completo do motorista',
    example: 'João da Silva',
  })
  @Expose()
  full_name!: string;

  @ApiProperty({
    description: 'Email do motorista',
    example: 'joao.silva@email.com',
  })
  @Expose()
  email!: string;

  @ApiProperty({
    description: 'Telefone do motorista (formatado)',
    example: '(11) 99999-9999',
  })
  @Expose()
  @Transform(({ value }: { value: string | undefined }) => {
    if (!value) {
      return value;
    }
    // Formata telefone celular: (11) 99999-9999
    if (value.length === 11) {
      return value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    // Formata telefone fixo: (11) 9999-9999
    if (value.length === 10) {
      return value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return value;
  })
  phone!: string;

  @ApiProperty({
    description: 'CPF do motorista (formatado)',
    example: '123.456.789-01',
  })
  @Expose()
  @Transform(({ value }: { value: string | undefined }) => {
    if (!value || typeof value !== 'string') {
      return value;
    }
    // Formata CPF: 123.456.789-01
    return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  })
  cpf!: string;
}

/**
 * DTO para dados básicos do endereço do cliente
 */
export class CustomerAddressBasicDto {
  @ApiProperty({
    description: 'ID único do endereço',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'Nome/Apelido do endereço',
    example: 'Matriz',
  })
  @Expose()
  address_name!: string;

  @ApiProperty({
    description: 'Endereço completo',
    example: 'Rua A, 123 - Centro, São Paulo - SP',
  })
  @Expose()
  full_address!: string;

  @ApiPropertyOptional({
    description: 'Ponto de referência',
    example: 'Próximo ao shopping',
  })
  @Expose()
  reference_point?: string;
}

/**
 * DTO para parada da rota na resposta
 */
export class RouteStopResponseDto {
  @ApiProperty({
    description: 'ID único da parada',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'ID do endereço do cliente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  customer_address_id!: string;

  @ApiProperty({
    description: 'Ordem na sequência da rota',
    example: 1,
    minimum: 1,
  })
  @Expose()
  sequence_order!: number;

  @ApiProperty({
    description: 'Status da parada',
    example: 'PENDING',
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'FAILED'],
  })
  @Expose()
  status!: string;

  @ApiProperty({
    description: 'Endereço completo da parada',
    example: 'Rua A, 123 - Bairro, Cidade - UF',
  })
  @Expose()
  address!: string;

  @ApiPropertyOptional({
    description: 'Coordenadas geográficas (lat, lng)',
    example: 'POINT(-23.5505199 -46.6333094)',
  })
  @Expose()
  coordinates?: string;

  @ApiPropertyOptional({
    description: 'Horário planejado de chegada',
    example: '09:00',
  })
  @Expose()
  planned_arrival_time?: string;

  @ApiPropertyOptional({
    description: 'Horário planejado de partida',
    example: '09:30',
  })
  @Expose()
  planned_departure_time?: string;

  @ApiPropertyOptional({
    description: 'Horário real de chegada',
    example: '2024-01-15T09:05:00Z',
  })
  @Expose()
  @Transform(({ value }: { value: Date | string | undefined }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  actual_arrival_time?: string;

  @ApiPropertyOptional({
    description: 'Horário real de partida',
    example: '2024-01-15T09:35:00Z',
  })
  @Expose()
  @Transform(({ value }: { value: Date | string | undefined }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  actual_departure_time?: string;

  @ApiPropertyOptional({
    description: 'Observações sobre a parada',
    example: 'Cliente preferencial - ligar antes',
  })
  @Expose()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Dados do endereço do cliente',
    type: CustomerAddressBasicDto,
  })
  @Expose()
  @Type(() => CustomerAddressBasicDto)
  customer_address?: CustomerAddressBasicDto;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-15T10:00:00Z',
  })
  @Expose()
  @Transform(({ value }: { value: Date | string }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  created_at!: string;

  @ApiProperty({
    description: 'Data de última atualização',
    example: '2024-01-15T14:00:00Z',
  })
  @Expose()
  @Transform(({ value }: { value: Date | string }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  updated_at!: string;

  // Campos sensíveis - NUNCA expostos
  @Exclude()
  internal_notes?: string;

  @Exclude()
  deleted_at?: Date;
}

/**
 * DTO para histórico de mudanças da rota
 */
export class RouteHistoryResponseDto {
  @ApiProperty({
    description: 'ID único do registro de histórico',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'Tipo de evento',
    example: 'ROUTE_CREATED',
  })
  @Expose()
  event_type!: string;

  @ApiProperty({
    description: 'Descrição do evento',
    example: 'Rota RT-20240115-001 criada',
  })
  @Expose()
  description!: string;

  @ApiPropertyOptional({
    description: 'Status anterior',
    enum: RouteStatus,
  })
  @Expose()
  previous_status?: RouteStatus;

  @ApiPropertyOptional({
    description: 'Novo status',
    enum: RouteStatus,
  })
  @Expose()
  new_status?: RouteStatus;

  @ApiProperty({
    description: 'Data do evento',
    example: '2024-01-15T10:00:00Z',
  })
  @Expose()
  @Transform(({ value }: { value: Date | string }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  created_at!: string;

  @Exclude()
  changed_fields?: unknown;
}

/**
 * DTO para resposta completa de rota
 *
 * Implementa mapeamento seguro com class-transformer
 * - Usa @Expose para controlar campos retornados
 * - Usa @Exclude para ocultar campos sensíveis
 * - Usa @Transform para formatações customizadas
 * - Usa @Type para nested objects
 */
export class RouteResponseDto {
  @ApiProperty({
    description: 'ID único da rota',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'Código único da rota',
    example: 'RT-20240115-001',
  })
  @Expose()
  route_code!: string;

  @ApiProperty({
    description: 'Nome identificador da rota',
    example: 'Rota Centro - Zona Sul',
  })
  @Expose()
  name!: string;

  @ApiPropertyOptional({
    description: 'Descrição detalhada da rota',
    example: 'Rota de entregas na região central e zona sul',
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Dados do veículo',
    type: VehicleBasicDto,
  })
  @Expose()
  @Type(() => VehicleBasicDto)
  vehicle!: VehicleBasicDto;

  @ApiProperty({
    description: 'ID do veículo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  vehicle_id!: string;

  @ApiProperty({
    description: 'Dados do motorista',
    type: DriverBasicDto,
  })
  @Expose()
  @Type(() => DriverBasicDto)
  driver!: DriverBasicDto;

  @ApiProperty({
    description: 'ID do motorista',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  driver_id!: string;

  @ApiProperty({
    description: 'Status atual da rota',
    enum: RouteStatus,
    example: RouteStatus.PLANNED,
  })
  @Expose()
  status!: RouteStatus;

  @ApiProperty({
    description: 'Tipo da rota',
    enum: RouteType as object,
    example: 'URBAN',
  })
  @Expose()
  type!: RouteType;

  @ApiProperty({
    description: 'Endereço completo de origem',
    example: 'Rua A, 100 - Centro, São Paulo - SP',
  })
  @Expose()
  origin_address!: string;

  @ApiPropertyOptional({
    description: 'Coordenadas geográficas de origem (lat, lng)',
    example: 'POINT(-23.5505199 -46.6333094)',
  })
  @Expose()
  origin_coordinates?: string;

  @ApiProperty({
    description: 'Endereço completo de destino',
    example: 'Rua B, 200 - Zona Sul, São Paulo - SP',
  })
  @Expose()
  destination_address!: string;

  @ApiPropertyOptional({
    description: 'Coordenadas geográficas de destino (lat, lng)',
    example: 'POINT(-23.6505199 -46.7333094)',
  })
  @Expose()
  destination_coordinates?: string;

  @ApiProperty({
    description: 'Data planejada para execução',
    example: '2024-01-15',
  })
  @Expose()
  @Transform(({ value }: { value: Date | string }) => {
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    return value;
  })
  planned_date!: string;

  @ApiPropertyOptional({
    description: 'Horário de início planejado',
    example: '08:00',
  })
  @Expose()
  planned_start_time?: string;

  @ApiPropertyOptional({
    description: 'Horário de término planejado',
    example: '18:00',
  })
  @Expose()
  planned_end_time?: string;

  @ApiPropertyOptional({
    description: 'Data/hora real de início',
    example: '2024-01-15T08:05:00Z',
  })
  @Expose()
  @Transform(({ value }: { value: Date | string | undefined }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  actual_start_time?: string;

  @ApiPropertyOptional({
    description: 'Data/hora real de término',
    example: '2024-01-15T17:50:00Z',
  })
  @Expose()
  @Transform(({ value }: { value: Date | string | undefined }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  actual_end_time?: string;

  @ApiPropertyOptional({
    description: 'Distância total estimada em quilômetros',
    example: 45.5,
  })
  @Expose()
  @Transform(({ value }: { value: number | string | undefined }) =>
    value ? parseFloat(value.toString()) : value,
  )
  estimated_distance_km?: number;

  @ApiPropertyOptional({
    description: 'Distância real percorrida em quilômetros',
    example: 47.2,
  })
  @Expose()
  @Transform(({ value }: { value: number | string | undefined }) =>
    value ? parseFloat(value.toString()) : value,
  )
  actual_distance_km?: number;

  @ApiPropertyOptional({
    description: 'Tempo estimado de viagem em minutos',
    example: 180,
  })
  @Expose()
  estimated_duration_minutes?: number;

  @ApiPropertyOptional({
    description: 'Duração real em minutos',
    example: 175,
  })
  @Expose()
  actual_duration_minutes?: number;

  @ApiPropertyOptional({
    description: 'Carga total planejada em kg',
    example: 1500.5,
  })
  @Expose()
  @Transform(({ value }: { value: number | string | undefined }) =>
    value ? parseFloat(value.toString()) : value,
  )
  total_load_kg?: number;

  @ApiPropertyOptional({
    description: 'Volume total planejado em m³',
    example: 12.3,
  })
  @Expose()
  @Transform(({ value }: { value: number | string | undefined }) =>
    value ? parseFloat(value.toString()) : value,
  )
  total_volume_m3?: number;

  @ApiPropertyOptional({
    description: 'Nível de dificuldade da rota (1-5)',
    example: 3,
    minimum: 1,
    maximum: 5,
  })
  @Expose()
  difficulty_level?: number;

  @ApiPropertyOptional({
    description: 'Observações gerais sobre a rota',
    example: 'Rota com tráfego intenso no período da manhã',
  })
  @Expose()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Motivo de cancelamento (quando aplicável)',
    example: 'Veículo com problema mecânico',
  })
  @Expose()
  cancellation_reason?: string;

  @ApiPropertyOptional({
    description: 'Data/hora de cancelamento',
    example: '2024-01-15T12:00:00Z',
  })
  @Expose()
  @Transform(({ value }: { value: Date | string | undefined }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  cancelled_at?: string;

  @ApiPropertyOptional({
    description: 'Paradas da rota',
    type: [RouteStopResponseDto],
    isArray: true,
  })
  @Expose()
  @Type(() => RouteStopResponseDto)
  stops?: RouteStopResponseDto[];

  @ApiProperty({
    description: 'Data de criação do registro',
    example: '2024-01-15T10:00:00Z',
  })
  @Expose()
  @Transform(({ value }: { value: Date | string }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  created_at!: string;

  @ApiProperty({
    description: 'Data de última atualização',
    example: '2024-01-15T14:00:00Z',
  })
  @Expose()
  @Transform(({ value }: { value: Date | string }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  updated_at!: string;

  // Campos sensíveis - NUNCA expostos na resposta
  @Exclude()
  deleted_at?: Date;

  @Exclude()
  internal_notes?: string;
}
