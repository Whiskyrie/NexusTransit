import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsDateString,
  ValidateNested,
  Min,
  Max,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DeliveryPriority } from '../../deliveries/enums/delivery-priority.enum';

export class DeliveryAddressDto {
  @ApiProperty({
    description: 'Rua',
    example: 'Av. Paulista',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  street!: string;

  @ApiProperty({
    description: 'Número',
    example: '1000',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  number!: string;

  @ApiPropertyOptional({
    description: 'Complemento',
    example: 'Apto 50',
  })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  complement?: string;

  @ApiProperty({
    description: 'Bairro',
    example: 'Centro',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  neighborhood!: string;

  @ApiProperty({
    description: 'Cidade',
    example: 'São Paulo',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
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
    example: '01310-100',
  })
  @IsString()
  @IsNotEmpty()
  @Length(8, 9)
  postal_code!: string;

  @ApiPropertyOptional({
    description: 'País',
    example: 'Brasil',
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  country?: string;

  @ApiPropertyOptional({
    description: 'Latitude',
    example: -23.5505,
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude',
    example: -46.6333,
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class DeliveryContactDto {
  @ApiProperty({
    description: 'Nome do contato',
    example: 'João Silva',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name!: string;

  @ApiProperty({
    description: 'Telefone',
    example: '(11) 99999-9999',
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 20)
  phone!: string;

  @ApiPropertyOptional({
    description: 'E-mail',
    example: 'joao@email.com',
  })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  email?: string;
}

export class GenerateDeliveryFromServiceOrderDto {
  @ApiProperty({
    description: 'ID do cliente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  customer_id!: string;

  @ApiProperty({
    description: 'Descrição do produto',
    example: 'Serviço de entrega conforme OS-2025-00001',
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
  @Min(0.1)
  @Max(1000)
  weight!: number;

  @ApiProperty({
    description: 'Valor declarado',
    example: 1500.0,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  declared_value!: number;

  @ApiPropertyOptional({
    description: 'Prioridade da entrega',
    example: 'NORMAL',
    enum: DeliveryPriority,
    required: false,
  })
  @IsOptional()
  priority?: DeliveryPriority;

  @ApiProperty({
    description: 'Endereço de coleta',
    type: DeliveryAddressDto,
  })
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  pickup_address!: DeliveryAddressDto;

  @ApiProperty({
    description: 'Endereço de entrega',
    type: DeliveryAddressDto,
  })
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  delivery_address!: DeliveryAddressDto;

  @ApiProperty({
    description: 'Contato na coleta',
    type: DeliveryContactDto,
  })
  @ValidateNested()
  @Type(() => DeliveryContactDto)
  pickup_contact!: DeliveryContactDto;

  @ApiProperty({
    description: 'Contato na entrega',
    type: DeliveryContactDto,
  })
  @ValidateNested()
  @Type(() => DeliveryContactDto)
  delivery_contact!: DeliveryContactDto;

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
    description: 'Observações',
    example: 'Entregar na portaria B',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;

  @ApiPropertyOptional({
    description: 'ID da ordem de serviço de origem',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @IsOptional()
  @IsString()
  service_order_id?: string;
}
