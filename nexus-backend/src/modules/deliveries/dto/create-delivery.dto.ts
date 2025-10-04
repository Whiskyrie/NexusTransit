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

// DTOs aninhados para validação
class AddressDto {
  @ApiProperty({
    description: 'Rua/Avenida',
    example: 'Rua das Flores',
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 100)
  street!: string;

  @ApiProperty({
    description: 'Número',
    example: '123',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  number!: string;

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
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  city!: string;

  @ApiProperty({
    description: 'Estado',
    example: 'SP',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 2)
  state!: string;

  @ApiProperty({
    description: 'CEP',
    example: '01234-567',
  })
  @IsString()
  @IsNotEmpty()
  @Length(8, 9)
  postal_code!: string;

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
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  name!: string;

  @ApiProperty({
    description: 'Telefone',
    example: '11987654321',
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 20)
  phone!: string;

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
  })
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(200)
  length!: number;

  @ApiProperty({
    description: 'Largura em cm',
    example: 20,
  })
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(200)
  width!: number;

  @ApiProperty({
    description: 'Altura em cm',
    example: 15,
  })
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(200)
  height!: number;

  @ApiProperty({
    description: 'Unidade de medida',
    example: 'cm',
    enum: ['cm', 'in'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['cm', 'in'])
  unit?: 'cm' | 'in';
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
    description: 'Manuseio especial (mínimo 1 instrução)',
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
    description: 'Tags do produto (mínimo 1 tag)',
    example: ['electronics', 'gift', 'urgent'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  tags?: string[];
}

// DTO para janelas de tempo
class TimeWindowDto {
  @ApiProperty({
    description: 'Hora de início',
    example: '09:00',
  })
  @IsString()
  @IsNotEmpty()
  start!: string;

  @ApiProperty({
    description: 'Hora de fim',
    example: '12:00',
  })
  @IsString()
  @IsNotEmpty()
  end!: string;
}

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
