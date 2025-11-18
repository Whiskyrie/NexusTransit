import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
  Max,
  Length,
  IsNumber,
  ValidateNested,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { RouteStatus } from '../enums/route-status';
import { RouteType } from '../enums/route.type';

/**
 * Gera uma data futura para exemplos do Swagger
 * Retorna a data de amanhã no formato YYYY-MM-DD
 */
function getExampleFutureDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0] as string;
}

/**
 * DTO para criar parada de rota
 */
export class CreateRouteStopDto {
  @ApiProperty({
    description: 'ID do endereço do cliente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  customer_address_id!: string;

  @ApiProperty({
    description: 'Ordem de parada na sequência',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  sequence_order!: number;

  @ApiPropertyOptional({
    description: 'Horário planejado de chegada (HH:mm)',
    example: '09:00',
  })
  @IsOptional()
  @IsString()
  @Length(5, 5)
  planned_arrival_time?: string;

  @ApiPropertyOptional({
    description: 'Horário planejado de partida (HH:mm)',
    example: '09:30',
  })
  @IsOptional()
  @IsString()
  @Length(5, 5)
  planned_departure_time?: string;

  @ApiPropertyOptional({
    description: 'Tempo estimado de parada em minutos',
    example: 15,
    minimum: 1,
    maximum: 480,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(480)
  estimated_stop_duration_minutes?: number;

  @ApiPropertyOptional({
    description: 'Dados da entrega/coleta',
  })
  @IsOptional()
  delivery_data?: {
    type?: 'DELIVERY' | 'PICKUP' | 'BOTH';
    order_numbers?: string[];
    items_count?: number;
    weight_kg?: number;
    volume_m3?: number;
    requires_signature?: boolean;
    requires_photo?: boolean;
    special_instructions?: string;
  };

  @ApiPropertyOptional({
    description: 'Observações da parada',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;
}

/**
 * DTO para criar rota
 */
export class CreateRouteDto {
  @ApiProperty({
    description: 'Código único da rota',
    example: 'RT-20240115-001',
    minLength: 5,
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 20)
  route_code!: string;

  @ApiProperty({
    description: 'Nome identificador da rota',
    example: 'Rota Centro - Zona Sul',
    minLength: 3,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 255)
  name!: string;

  @ApiPropertyOptional({
    description: 'Descrição detalhada da rota',
    example: 'Rota para entregas no centro e zona sul da cidade',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;

  @ApiProperty({
    description: 'ID do veículo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  vehicle_id!: string;

  @ApiProperty({
    description: 'ID do motorista',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  driver_id!: string;

  @ApiPropertyOptional({
    description: 'Status da rota',
    enum: RouteStatus,
    example: RouteStatus.PLANNED,
    default: RouteStatus.PLANNED,
  })
  @IsOptional()
  @IsEnum(RouteStatus)
  status?: RouteStatus = RouteStatus.PLANNED;

  @ApiProperty({
    description: 'Tipo da rota',
    enum: RouteType,
    example: RouteType.URBAN,
  })
  @IsEnum(RouteType)
  @IsNotEmpty()
  type!: RouteType;

  @ApiProperty({
    description: 'Endereço de origem completo',
    example: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
    minLength: 10,
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 500)
  origin_address!: string;

  @ApiPropertyOptional({
    description: 'Coordenadas de origem (lat, lng)',
    example: 'POINT(-23.561414 -46.656250)',
  })
  @IsOptional()
  @IsString()
  origin_coordinates?: string;

  @ApiProperty({
    description: 'Endereço de destino completo',
    example: 'Rua da Consolação, 2000 - Consolação, São Paulo - SP',
    minLength: 10,
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 500)
  destination_address!: string;

  @ApiPropertyOptional({
    description: 'Coordenadas de destino (lat, lng)',
    example: 'POINT(-23.551415 -46.656251)',
  })
  @IsOptional()
  @IsString()
  destination_coordinates?: string;

  @ApiProperty({
    description: 'Data planejada para execução (YYYY-MM-DD)',
    example: getExampleFutureDate(),
  })
  @IsDateString()
  @IsNotEmpty()
  planned_date!: string;

  @ApiPropertyOptional({
    description: 'Horário de início planejado (HH:mm)',
    example: '08:00',
  })
  @IsOptional()
  @IsString()
  @Length(5, 5)
  planned_start_time?: string;

  @ApiPropertyOptional({
    description: 'Horário de término planejado (HH:mm)',
    example: '18:00',
  })
  @IsOptional()
  @IsString()
  @Length(5, 5)
  planned_end_time?: string;

  @ApiPropertyOptional({
    description: 'Distância total estimada em km',
    example: 45.5,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimated_distance_km?: number;

  @ApiPropertyOptional({
    description: 'Tempo estimado em minutos',
    example: 180,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimated_duration_minutes?: number;

  @ApiPropertyOptional({
    description: 'Capacidade máxima de carga em kg',
    example: 1000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  max_vehicle_capacity_kg?: number;

  @ApiPropertyOptional({
    description: 'Volume máximo em m³',
    example: 10,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  max_vehicle_volume_m3?: number;

  @ApiPropertyOptional({
    description: 'Carga total da rota em kg',
    example: 750,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  total_load_kg?: number;

  @ApiPropertyOptional({
    description: 'Volume total da rota em m³',
    example: 7.5,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  total_volume_m3?: number;

  @ApiPropertyOptional({
    description: 'Custo estimado de combustível',
    example: 150.5,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fuel_cost_estimate?: number;

  @ApiPropertyOptional({
    description: 'Consumo estimado de combustível em litros',
    example: 35.2,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fuel_consumption_estimate?: number;

  @ApiPropertyOptional({
    description: 'Nível de dificuldade da rota (1-5)',
    example: 3,
    minimum: 1,
    maximum: 5,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty_level?: number = 1;

  @ApiPropertyOptional({
    description: 'Dados de otimização',
  })
  @IsOptional()
  optimization_data?: {
    algorithm_used?: string;
    optimization_score?: number;
    alternative_routes?: Record<string, unknown>[];
    traffic_conditions?: string;
    weather_conditions?: string;
  };

  @ApiPropertyOptional({
    description: 'Restrições da rota',
  })
  @IsOptional()
  restrictions?: {
    weight_limit_kg?: number;
    height_limit_m?: number;
    width_limit_m?: number;
    hazmat_allowed?: boolean;
    toll_roads_allowed?: boolean;
    night_delivery_allowed?: boolean;
  };

  @ApiPropertyOptional({
    description: 'Observações gerais',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  notes?: string;

  @ApiPropertyOptional({
    description: 'Lista de paradas da rota',
    type: [CreateRouteStopDto],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateRouteStopDto)
  stops?: CreateRouteStopDto[];
}
