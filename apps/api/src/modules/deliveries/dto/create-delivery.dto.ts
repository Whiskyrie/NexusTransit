import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsPositive,
  IsNumber,
  IsDateString,
  IsObject,
  IsEmail,
  IsArray,
  ValidateNested,
  Min,
  Max,
  Length,
  IsUUID,
  IsBoolean,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DeliveryPriority } from '../enums/delivery-priority.enum';
import { AddressDto } from './address.dto';
import { ContactDto } from './contact.dto';
import { DimensionsDto } from './dimensions.dto';
import { ProductInfoDto } from './product-info.dto';
import { TimeWindowDto } from './time-window.dto';

export class CreateDeliveryDto {
  @ApiProperty({
    description: 'ID do cliente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  customer_id!: string;

  @ApiProperty({
    description: 'ID do motorista (opcional)',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  driver_id?: string;

  @ApiProperty({
    description: 'ID do veículo (opcional)',
    example: '123e4567-e89b-12d3-a456-426614174002',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  vehicle_id?: string;

  @ApiProperty({
    description: 'Prioridade da entrega',
    example: 'NORMAL',
    enum: DeliveryPriority,
    required: false,
  })
  @IsOptional()
  @IsEnum(DeliveryPriority)
  priority?: DeliveryPriority;

  @ApiProperty({
    description: 'Descrição do produto',
    example: 'Caixa com eletrônicos',
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 500)
  description!: string;

  @ApiProperty({
    description: 'Peso em kg',
    example: 5.5,
    minimum: 0.1,
    maximum: 1000,
  })
  @IsNumber()
  @IsPositive()
  @Min(0.1)
  @Max(1000)
  weight!: number;

  @ApiProperty({
    description: 'Valor declarado',
    example: 1500.0,
    minimum: 0.01,
  })
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  declared_value!: number;

  @ApiProperty({
    description: 'Dimensões da embalagem',
    type: DimensionsDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DimensionsDto)
  dimensions?: DimensionsDto;

  @ApiProperty({
    description: 'Informações do produto',
    type: ProductInfoDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductInfoDto)
  product_info?: ProductInfoDto;

  @ApiProperty({
    description: 'Endereço de coleta',
    type: AddressDto,
  })
  @ValidateNested()
  @Type(() => AddressDto)
  pickup_address!: AddressDto;

  @ApiProperty({
    description: 'Endereço de entrega',
    type: AddressDto,
  })
  @ValidateNested()
  @Type(() => AddressDto)
  delivery_address!: AddressDto;

  @ApiProperty({
    description: 'Contato do remetente',
    type: ContactDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContactDto)
  sender_contact?: ContactDto;

  @ApiProperty({
    description: 'Contato do destinatário',
    type: ContactDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContactDto)
  recipient_contact?: ContactDto;

  @ApiProperty({
    description: 'Email do remetente (opcional)',
    example: 'remetente@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  sender_email?: string;

  @ApiProperty({
    description: 'Email do destinatário (opcional)',
    example: 'destinatario@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  recipient_email?: string;

  @ApiProperty({
    description: 'Data/hora agendada para coleta',
    example: '2024-01-15T09:00:00Z',
  })
  @IsDateString()
  scheduled_pickup_at!: string;

  @ApiProperty({
    description: 'Data/hora agendada para entrega',
    example: '2024-01-15T15:00:00Z',
  })
  @IsDateString()
  scheduled_delivery_at!: string;

  @ApiProperty({
    description: 'Instruções para coleta',
    example: 'Retirar na recepção',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  pickup_instructions?: string;

  @ApiProperty({
    description: 'Instruções para entrega',
    example: 'Entregar com João da portaria',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  delivery_instructions?: string;

  @ApiProperty({
    description: 'Observações gerais',
    example: 'Produto frágil',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  notes?: string;

  @ApiProperty({
    description: 'URLs de fotos do produto (mínimo 1 foto)',
    example: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  product_photos?: string[];

  @ApiProperty({
    description: 'Lista de itens na entrega (mínimo 1 item)',
    example: ['Item 1', 'Item 2'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsString({ each: true })
  items_list?: string[];

  @ApiProperty({
    description: 'Janelas de tempo permitidas (mínimo 1)',
    type: [TimeWindowDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => TimeWindowDto)
  time_windows?: TimeWindowDto[];

  @ApiProperty({
    description: 'Requer assinatura na entrega',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  requires_signature?: boolean;

  @ApiProperty({
    description: 'Requer foto na entrega',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  requires_photo?: boolean;

  @ApiProperty({
    description: 'Requer documento de identificação',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  requires_id?: boolean;

  @ApiProperty({
    description: 'Produto é frágil',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_fragile?: boolean;

  @ApiProperty({
    description: 'Entrega urgente',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_urgent?: boolean;

  @ApiProperty({
    description: 'Configurações especiais',
    required: false,
  })
  @IsOptional()
  @IsObject()
  settings?: {
    requires_signature?: boolean;
    requires_photo?: boolean;
    requires_id?: boolean;
    allowed_attempt_count?: number;
    restricted_hours?: {
      start: string;
      end: string;
    }[];
  };

  @ApiProperty({
    description: 'Informações de pagamento',
    required: false,
  })
  @IsOptional()
  @IsObject()
  payment_info?: {
    method?: 'CASH' | 'CARD' | 'TRANSFER' | 'INVOICE';
    amount?: number;
  };
}
