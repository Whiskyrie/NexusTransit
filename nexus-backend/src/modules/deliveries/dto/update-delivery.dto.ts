import {
  IsString,
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
import { DeliveryStatus } from '../enums/delivery-status.enum';

// DTOs aninhados para atualização (parciais)
class AddressDto {
  @ApiProperty({
    description: 'Rua/Avenida',
    example: 'Rua das Flores',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(5, 100)
  street?: string;

  @ApiProperty({
    description: 'Número',
    example: '123',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  number?: string;

  @ApiProperty({
    description: 'Complemento',
    example: 'Apto 101',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  complement?: string;

  @ApiProperty({
    description: 'Bairro',
    example: 'Centro',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  neighborhood?: string;

  @ApiProperty({
    description: 'Cidade',
    example: 'São Paulo',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  city?: string;

  @ApiProperty({
    description: 'Estado',
    example: 'SP',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  state?: string;

  @ApiProperty({
    description: 'CEP',
    example: '01234-567',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(8, 9)
  postal_code?: string;

  @ApiProperty({
    description: 'País',
    example: 'Brasil',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  country?: string;

  @ApiProperty({
    description: 'Latitude',
    example: -23.5505,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiProperty({
    description: 'Longitude',
    example: -46.6333,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiProperty({
    description: 'Instruções especiais',
    example: 'Entregar na portaria',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  instructions?: string;
}

class ContactDto {
  @ApiProperty({
    description: 'Nome do contato',
    example: 'João Silva',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(3, 100)
  name?: string;

  @ApiProperty({
    description: 'Telefone',
    example: '11987654321',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(10, 20)
  phone?: string;

  @ApiProperty({
    description: 'Email',
    example: 'joao@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Documento (CPF/CNPJ)',
    example: '12345678901',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(11, 14)
  document?: string;
}

class DimensionsDto {
  @ApiProperty({
    description: 'Comprimento em cm',
    example: 30,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(200)
  length?: number;

  @ApiProperty({
    description: 'Largura em cm',
    example: 20,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(200)
  width?: number;

  @ApiProperty({
    description: 'Altura em cm',
    example: 15,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(200)
  height?: number;

  @ApiProperty({
    description: 'Unidade de medida',
    example: 'cm',
    enum: ['cm', 'in'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['cm', 'in'])
  unit?: 'cm' | 'in';

  @ApiProperty({
    description: 'Volume calculado em cm³',
    example: 9000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(8000000)
  volume?: number;
}

class ProductInfoDto {
  @ApiProperty({
    description: 'Categoria do produto',
    example: 'Eletrônicos',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  category?: string;

  @ApiProperty({
    description: 'Nível de fragilidade',
    example: 'MEDIUM',
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH'])
  fragility?: 'LOW' | 'MEDIUM' | 'HIGH';

  @ApiProperty({
    description: 'Produto perecível',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  perishable?: boolean;

  @ApiProperty({
    description: 'Empilhável',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  stackable?: boolean;

  @ApiProperty({
    description: 'Requer refrigeração',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  requires_refrigeration?: boolean;

  @ApiProperty({
    description: 'É material perigoso',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_hazardous?: boolean;

  @ApiProperty({
    description: 'Manuseio especial',
    example: ['Fragile', 'This side up'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  special_handling?: string[];

  @ApiProperty({
    description: 'Temperatura mínima em °C',
    example: 2,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(-50)
  @Max(100)
  min_temperature?: number;

  @ApiProperty({
    description: 'Temperatura máxima em °C',
    example: 8,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(-50)
  @Max(100)
  max_temperature?: number;
}

class TimeWindowDto {
  @ApiProperty({
    description: 'Hora de início',
    example: '09:00',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(5, 5)
  start?: string;

  @ApiProperty({
    description: 'Hora de fim',
    example: '12:00',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(5, 5)
  end?: string;

  @ApiProperty({
    description: 'Dia da semana (0-6)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(6)
  day_of_week?: number;
}

class SettingsDto {
  @ApiProperty({
    description: 'Requer assinatura',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  requires_signature?: boolean;

  @ApiProperty({
    description: 'Requer foto',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  requires_photo?: boolean;

  @ApiProperty({
    description: 'Requer documento',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  requires_id?: boolean;

  @ApiProperty({
    description: 'Permite entrega parcial',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  allow_partial_delivery?: boolean;

  @ApiProperty({
    description: 'Número de tentativas permitidas',
    example: 3,
    minimum: 1,
    maximum: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  allowed_attempt_count?: number;

  @ApiProperty({
    description: 'Janelas de tempo permitidas',
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
    description: 'Horários restritos',
    type: [TimeWindowDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => TimeWindowDto)
  restricted_hours?: TimeWindowDto[];
}

class PaymentInfoDto {
  @ApiProperty({
    description: 'Método de pagamento',
    example: 'CARD',
    enum: ['CASH', 'CARD', 'TRANSFER', 'INVOICE'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['CASH', 'CARD', 'TRANSFER', 'INVOICE'])
  method?: 'CASH' | 'CARD' | 'TRANSFER' | 'INVOICE';

  @ApiProperty({
    description: 'Status do pagamento',
    example: 'PAID',
    enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['PENDING', 'PAID', 'FAILED', 'REFUNDED'])
  status?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

  @ApiProperty({
    description: 'Valor',
    example: 35.0,
    minimum: 0,
    maximum: 100000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100000)
  amount?: number;

  @ApiProperty({
    description: 'Data/hora do pagamento',
    example: '2024-01-15T10:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  paid_at?: string;

  @ApiProperty({
    description: 'ID da transação',
    example: 'txn_123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(5, 100)
  transaction_id?: string;

  @ApiProperty({
    description: 'Pagamento foi processado',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_processed?: boolean;

  @ApiProperty({
    description: 'Pagamento foi estornado',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_refunded?: boolean;
}

class TrackingDataDto {
  @ApiProperty({
    description: 'Última latitude',
    example: -23.5505,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  last_latitude?: number;

  @ApiProperty({
    description: 'Última longitude',
    example: -46.6333,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  last_longitude?: number;

  @ApiProperty({
    description: 'Última atualização',
    example: '2024-01-15T15:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  last_update?: string;

  @ApiProperty({
    description: 'Velocidade em km/h',
    example: 60,
    minimum: 0,
    maximum: 200,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(200)
  speed?: number;

  @ApiProperty({
    description: 'Direção em graus',
    example: 90,
    minimum: 0,
    maximum: 360,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number;

  @ApiProperty({
    description: 'Precisão em metros',
    example: 10,
    minimum: 0,
    maximum: 10000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  accuracy?: number;

  @ApiProperty({
    description: 'Rastreamento está ativo',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({
    description: 'Bateria do dispositivo em %',
    example: 85,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  battery_level?: number;
}

// DTO adicional para metadados customizados
class CustomMetadataDto {
  @ApiProperty({
    description: 'Chave do metadado',
    example: 'customer_reference',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  key?: string;

  @ApiProperty({
    description: 'Valor do metadado',
    example: 'ORDER-123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  value?: string;

  @ApiProperty({
    description: 'Tipo do valor',
    example: 'string',
    enum: ['string', 'number', 'boolean'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['string', 'number', 'boolean'])
  type?: 'string' | 'number' | 'boolean';
}

export class UpdateDeliveryDto {
  @ApiProperty({
    description: 'ID do motorista (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  driver_id?: string;

  @ApiProperty({
    description: 'ID do veículo (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174002',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  vehicle_id?: string;

  @ApiProperty({
    description: 'ID da rota (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174003',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  route_id?: string;

  @ApiProperty({
    description: 'Status da entrega',
    example: 'ASSIGNED',
    enum: DeliveryStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(DeliveryStatus)
  status?: DeliveryStatus;

  @ApiProperty({
    description: 'Prioridade da entrega',
    example: 'HIGH',
    enum: DeliveryPriority,
    required: false,
  })
  @IsOptional()
  @IsEnum(DeliveryPriority)
  priority?: DeliveryPriority;

  @ApiProperty({
    description: 'Descrição do produto',
    example: 'Caixa com eletrônicos',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(10, 500)
  description?: string;

  @ApiProperty({
    description: 'Peso em kg',
    example: 5.5,
    minimum: 0.1,
    maximum: 1000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(0.1)
  @Max(1000)
  weight?: number;

  @ApiProperty({
    description: 'Valor declarado',
    example: 1500,
    minimum: 0.01,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  declared_value?: number;

  @ApiProperty({
    description: 'Dimensões da embalagem',
    type: DimensionsDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DimensionsDto)
  @IsObject()
  dimensions?: DimensionsDto;

  @ApiProperty({
    description: 'Informações do produto',
    type: ProductInfoDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductInfoDto)
  @IsObject()
  product_info?: ProductInfoDto;

  @ApiProperty({
    description: 'Endereço de coleta',
    type: AddressDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  @IsObject()
  pickup_address?: AddressDto;

  @ApiProperty({
    description: 'Endereço de entrega',
    type: AddressDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  @IsObject()
  delivery_address?: AddressDto;

  @ApiProperty({
    description: 'Contato do remetente',
    type: ContactDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContactDto)
  @IsObject()
  sender_contact?: ContactDto;

  @ApiProperty({
    description: 'Contato do destinatário',
    type: ContactDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContactDto)
  @IsObject()
  recipient_contact?: ContactDto;

  @ApiProperty({
    description: 'Data/hora agendada para coleta',
    example: '2024-01-15T09:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  scheduled_pickup_at?: string;

  @ApiProperty({
    description: 'Data/hora agendada para entrega',
    example: '2024-01-15T15:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  scheduled_delivery_at?: string;

  @ApiProperty({
    description: 'Data/hora real da coleta',
    example: '2024-01-15T09:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  actual_pickup_at?: string;

  @ApiProperty({
    description: 'Data/hora real da entrega',
    example: '2024-01-15T15:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  actual_delivery_at?: string;

  @ApiProperty({
    description: 'Distância estimada em km',
    example: 25.5,
    minimum: 0,
    maximum: 1000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  estimated_distance?: number;

  @ApiProperty({
    description: 'Duração estimada em minutos',
    example: 45,
    minimum: 0,
    maximum: 1440,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1440)
  estimated_duration?: number;

  @ApiProperty({
    description: 'Taxa de entrega',
    example: 25.0,
    minimum: 0,
    maximum: 10000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  delivery_fee?: number;

  @ApiProperty({
    description: 'Custo total da entrega',
    example: 35.0,
    minimum: 0,
    maximum: 10000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  total_cost?: number;

  @ApiProperty({
    description: 'Informações de pagamento',
    type: PaymentInfoDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentInfoDto)
  @IsObject()
  payment_info?: PaymentInfoDto;

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
    description: 'Tags da entrega',
    example: ['urgent', 'fragile', 'high_value'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(15)
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({
    description: 'URLs de fotos do produto',
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
    description: 'Metadados customizados',
    type: [CustomMetadataDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CustomMetadataDto)
  custom_metadata?: CustomMetadataDto[];

  @ApiProperty({
    description: 'Entrega foi cancelada',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_cancelled?: boolean;

  @ApiProperty({
    description: 'Entrega está ativa',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({
    description: 'Notificações habilitadas',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  notifications_enabled?: boolean;

  @ApiProperty({
    description: 'Entrega está atrasada',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_delayed?: boolean;

  @ApiProperty({
    description: 'Configurações especiais',
    type: SettingsDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SettingsDto)
  @IsObject()
  settings?: SettingsDto;

  @ApiProperty({
    description: 'Dados de rastreamento em tempo real',
    type: TrackingDataDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TrackingDataDto)
  @IsObject()
  tracking_data?: TrackingDataDto;
}
