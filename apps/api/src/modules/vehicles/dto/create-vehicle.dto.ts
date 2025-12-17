import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsPositive,
  IsInt,
  IsBoolean,
  IsDateString,
  Min,
  Max,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { VehicleType } from '../enums/vehicle-type.enum';
import { FuelType } from '../enums/fuel-type.enum';
import { VehicleStatus } from '../enums/vehicle-status.enum';
import { LicensePlateType } from '../enums/license-plate-type.enum';
import { IsLicensePlate, normalizeLicensePlate } from '@nexus/common';

export class CreateVehicleDto {
  @ApiProperty({
    description: 'Placa do veículo no padrão brasileiro',
    example: 'ABC1234',
    pattern: '^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$',
  })
  @IsString()
  @IsNotEmpty()
  @IsLicensePlate()
  @Transform(({ value }) =>
    normalizeLicensePlate(typeof value === 'string' ? value : String(value)),
  )
  license_plate!: string;

  @ApiProperty({
    description: 'Tipo de formato da placa',
    enum: LicensePlateType,
    example: LicensePlateType.MERCOSUL,
    default: LicensePlateType.MERCOSUL,
    required: false,
  })
  @IsOptional()
  @IsEnum(LicensePlateType)
  license_plate_type?: LicensePlateType = LicensePlateType.MERCOSUL;

  @ApiProperty({
    description: 'Marca do veículo',
    example: 'Toyota',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  brand!: string;

  @ApiProperty({
    description: 'Modelo do veículo',
    example: 'Corolla',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  model!: string;

  @ApiProperty({
    description: 'Ano de fabricação',
    example: 2023,
    minimum: 1900,
    maximum: 2030,
  })
  @IsInt()
  @Min(1900)
  @Max(2030)
  year!: number;

  @ApiProperty({
    description: 'Cor do veículo',
    example: 'Branco',
    required: false,
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @Length(2, 30)
  color?: string;

  @ApiProperty({
    description: 'Tipo do veículo',
    enum: VehicleType,
    example: VehicleType.CAR,
  })
  @IsEnum(VehicleType)
  vehicle_type: VehicleType = VehicleType.TRUCK;

  @ApiProperty({
    description: 'Status inicial do veículo',
    enum: VehicleStatus,
    example: VehicleStatus.ACTIVE,
    default: VehicleStatus.ACTIVE,
    required: false,
  })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus = VehicleStatus.ACTIVE;

  @ApiProperty({
    description: 'Tipo de combustível',
    enum: FuelType,
    example: FuelType.GASOLINE,
  })
  @IsEnum(FuelType)
  fuel_type: FuelType = FuelType.GASOLINE;

  @ApiProperty({
    description: 'Capacidade de carga em kg',
    example: 500.5,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsPositive()
  load_capacity?: number;

  @ApiProperty({
    description: 'Volume de carga em m³',
    example: 2.5,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsPositive()
  cargo_volume?: number;

  @ApiProperty({
    description: 'Capacidade do tanque em litros',
    example: 50.0,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsPositive()
  fuel_capacity?: number;

  @ApiProperty({
    description: 'Quilometragem atual',
    example: 15000,
    default: 0,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  mileage?: number = 0;

  @ApiProperty({
    description: 'Data da última manutenção',
    example: '2023-01-15',
    required: false,
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  last_maintenance_at?: string;

  @ApiProperty({
    description: 'Data da próxima manutenção programada',
    example: '2024-01-15',
    required: false,
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  next_maintenance_at?: string;

  @ApiProperty({
    description: 'Próxima manutenção em km',
    example: 20000,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsPositive()
  next_maintenance_km?: number;

  @ApiProperty({
    description: 'Número do chassi',
    example: '9BWZZZ377VT000000',
    required: false,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  chassis_number?: string;

  @ApiProperty({
    description: 'Número do RENAVAM',
    example: '12345678901',
    required: false,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  renavam?: string;

  @ApiProperty({
    description: 'Data de aquisição do veículo',
    example: '2023-01-15',
    required: false,
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  acquisition_date?: string;

  @ApiProperty({
    description: 'Valor de aquisição',
    example: 100000.0,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsPositive()
  acquisition_value?: number;

  @ApiProperty({
    description: 'Consumo médio em km/l',
    example: 12.5,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsPositive()
  average_consumption?: number;

  @ApiProperty({
    description: 'Seguradora',
    example: 'Seguradora XYZ',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  insurance_company?: string;

  @ApiProperty({
    description: 'Número da apólice de seguro',
    example: '123456789',
    required: false,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  insurance_policy_number?: string;

  @ApiProperty({
    description: 'Data de vencimento do seguro',
    example: '2024-12-31',
    required: false,
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  insurance_expiry_date?: string;

  @ApiProperty({
    description: 'Data de vencimento do licenciamento',
    example: '2024-12-31',
    required: false,
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  license_expiry_date?: string;

  @ApiProperty({
    description: 'Observações gerais',
    example: 'Veículo com ar condicionado e direção hidráulica',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Possui rastreamento GPS',
    example: true,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  has_gps?: boolean = false;

  @ApiProperty({
    description: 'Possui refrigeração',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  has_refrigeration?: boolean = false;

  @ApiProperty({
    description: 'Capacidade de passageiros',
    example: 5,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsPositive()
  passenger_capacity?: number;

  @ApiProperty({
    description: 'Informações de seguro em formato JSON',
    example: {
      company: 'Seguradora XYZ',
      policy_number: '123456789',
      expiry_date: '2024-12-31',
    },
    required: false,
  })
  @IsOptional()
  insurance_info?: Record<string, unknown>;

  @ApiProperty({
    description: 'Especificações técnicas adicionais em formato JSON',
    example: {
      engine: '2.0 Turbo',
      transmission: 'Automática',
      drivetrain: 'FWD',
    },
    required: false,
  })
  @IsOptional()
  specifications?: Record<string, unknown>;
}
