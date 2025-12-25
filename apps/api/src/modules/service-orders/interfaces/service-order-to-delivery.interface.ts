import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsObject,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DeliveryPriority } from '../../deliveries/enums/delivery-priority.enum';

/**
 * Interface para mapeamento de dados de ServiceOrder para criação de Delivery
 *
 * Utilizada para gerar automaticamente entregas a partir de ordens de serviço
 * do tipo PICKUP ou DELIVERY
 */
export class ServiceOrderAddressDto {
  @ApiProperty({
    description: 'Rua/Avenida',
    example: 'Rua das Flores',
  })
  @IsString()
  @IsNotEmpty()
  street!: string;

  @ApiProperty({
    description: 'Número',
    example: '123',
  })
  @IsString()
  @IsNotEmpty()
  number!: string;

  @ApiPropertyOptional({
    description: 'Complemento',
    example: 'Apto 101',
  })
  @IsOptional()
  @IsString()
  complement?: string;

  @ApiPropertyOptional({
    description: 'Bairro',
    example: 'Centro',
  })
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiProperty({
    description: 'Cidade',
    example: 'São Paulo',
  })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({
    description: 'Estado (UF)',
    example: 'SP',
  })
  @IsString()
  @IsNotEmpty()
  state!: string;

  @ApiProperty({
    description: 'CEP',
    example: '01234-567',
  })
  @IsString()
  @IsNotEmpty()
  postal_code!: string;

  @ApiPropertyOptional({
    description: 'País',
    example: 'Brasil',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    description: 'Latitude',
    example: -23.5505,
  })
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude',
    example: -46.6333,
  })
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Instruções especiais',
    example: 'Entregar na portaria',
  })
  @IsOptional()
  @IsString()
  instructions?: string;
}

/**
 * DTO para geração de entrega a partir de ServiceOrder
 *
 * Contém todos os dados necessários para criar uma Delivery
 * a partir de uma Ordem de Serviço
 */
export class GenerateDeliveryFromServiceOrderDto {
  @ApiProperty({
    description: 'ID do cliente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  customer_id!: string;

  @ApiPropertyOptional({
    description: 'ID do motorista opcional',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsString()
  driver_id?: string;

  @ApiPropertyOptional({
    description: 'ID do veículo opcional',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsOptional()
  @IsString()
  vehicle_id?: string;

  @ApiProperty({
    description: 'Descrição do produto/item',
    example: 'Caixa com peças automotivas',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({
    description: 'Peso em kg',
    example: 5.5,
  })
  @IsString()
  @IsNotEmpty()
  weight!: string;

  @ApiProperty({
    description: 'Valor declarado da mercadoria',
    example: 1500.0,
  })
  @IsString()
  @IsNotEmpty()
  declared_value!: string;

  @ApiPropertyOptional({
    description: 'Prioridade da entrega',
    enum: DeliveryPriority,
    example: DeliveryPriority.NORMAL,
  })
  @IsOptional()
  @IsEnum(DeliveryPriority)
  priority?: DeliveryPriority;

  @ApiPropertyOptional({
    description: 'Endereço de coleta (opcional, usa localização da OS)',
    type: ServiceOrderAddressDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ServiceOrderAddressDto)
  pickup_address?: ServiceOrderAddressDto;

  @ApiProperty({
    description: 'Endereço de entrega',
    type: ServiceOrderAddressDto,
  })
  @ValidateNested()
  @Type(() => ServiceOrderAddressDto)
  delivery_address!: ServiceOrderAddressDto;

  @ApiProperty({
    description: 'Data e hora agendada para coleta',
    example: '2025-12-26T08:00:00Z',
  })
  @IsDateString()
  scheduled_pickup_at!: string;

  @ApiProperty({
    description: 'Data e hora agendada para entrega',
    example: '2025-12-26T14:00:00Z',
  })
  @IsDateString()
  scheduled_delivery_at!: string;

  @ApiPropertyOptional({
    description: 'Observações adicionais',
    example: 'Cliente prefers entrega pela manhã',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Metadados adicionais em formato JSON',
    example: { service_order_number: 'OS-2025-00001' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
