import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
  IsPositive,
  IsInt,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { MaintenanceType } from '../enums';
import { PartUsedDto } from './parts-used.dto';
import { ServicePerformedDto } from './service-performed.dto';

export class CreateMaintenanceDto {
  @ApiProperty({
    description: 'Tipo de manutenção',
    enum: MaintenanceType,
    example: MaintenanceType.PREVENTIVE,
  })
  @IsEnum(MaintenanceType)
  @IsNotEmpty()
  maintenance_type!: MaintenanceType;

  @ApiProperty({
    description: 'Título ou resumo da manutenção',
    example: 'Revisão dos 10.000 km',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    description: 'Descrição detalhada dos serviços realizados',
    example: 'Troca de óleo, filtro de óleo e verificação geral',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({
    description: 'Data em que a manutenção foi realizada ou agendada',
    example: '2023-12-15',
  })
  @IsDateString()
  @IsNotEmpty()
  maintenance_date!: string;

  @ApiProperty({
    description: 'Quilometragem do veículo no momento da manutenção',
    example: 10000,
  })
  @IsInt()
  @IsPositive()
  mileage_at_maintenance!: number;

  @ApiPropertyOptional({
    description: 'Nome da oficina ou prestador de serviço',
    example: 'AutoCenter LTDA',
  })
  @IsOptional()
  @IsString()
  service_provider?: string;

  @ApiPropertyOptional({
    description: 'Telefone de contato do prestador de serviço',
    example: '(11) 98765-4321',
  })
  @IsOptional()
  @IsString()
  service_provider_contact?: string;

  @ApiPropertyOptional({
    description: 'Endereço do local onde foi realizada a manutenção',
    example: 'Rua das Flores, 123',
  })
  @IsOptional()
  @IsString()
  service_location?: string;

  @ApiPropertyOptional({
    description: 'Data programada para a próxima manutenção deste tipo',
    example: '2024-06-15',
  })
  @IsOptional()
  @IsDateString()
  next_maintenance_date?: string;

  @ApiPropertyOptional({
    description: 'Quilometragem prevista para a próxima manutenção',
    example: 20000,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  next_maintenance_mileage?: number;

  @ApiPropertyOptional({
    description: 'Número da ordem de serviço ou nota fiscal',
    example: 'OS-2023-1234',
  })
  @IsOptional()
  @IsString()
  service_order_number?: string;

  @ApiPropertyOptional({
    description: 'Garantia oferecida pelo serviço',
    example: '6 meses ou 10.000 km',
  })
  @IsOptional()
  @IsString()
  warranty_period?: string;

  @ApiPropertyOptional({
    description: 'Data de expiração da garantia do serviço',
    example: '2024-06-15',
  })
  @IsOptional()
  @IsDateString()
  warranty_expiry_date?: string;

  @ApiPropertyOptional({
    description: 'Lista de peças utilizadas na manutenção',
    type: [PartUsedDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartUsedDto)
  parts_used?: PartUsedDto[];

  @ApiPropertyOptional({
    description: 'Lista de serviços realizados',
    type: [ServicePerformedDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServicePerformedDto)
  services_performed?: ServicePerformedDto[];

  @ApiPropertyOptional({
    description: 'Observações adicionais sobre a manutenção',
    example: 'Veículo apresentou ruído no motor',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
