import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { VehicleType } from '../enums/vehicle-type.enum';
import { VehicleStatus } from '../enums/vehicle-status.enum';
import { FuelType } from '../enums/fuel-type.enum';
import { LicensePlateType } from '../enums/license-plate-type.enum';

export class VehicleResponseDto {
  @ApiProperty({
    description: 'ID único do veículo',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'Placa do veículo',
    example: 'ABC-1234',
  })
  @Expose()
  @Transform(({ value }) => ((value as string) || '').replace(/([A-Z]{3})([0-9A-Z]{4})/, '$1-$2'))
  license_plate!: string;

  @ApiProperty({
    description: 'Tipo de formato da placa',
    enum: LicensePlateType,
    example: LicensePlateType.MERCOSUL,
  })
  @Expose()
  license_plate_type!: LicensePlateType;

  @ApiProperty({
    description: 'Marca do veículo',
    example: 'Toyota',
  })
  @Expose()
  brand!: string;

  @ApiProperty({
    description: 'Modelo do veículo',
    example: 'Corolla',
  })
  @Expose()
  model!: string;

  @ApiProperty({
    description: 'Ano de fabricação',
    example: 2023,
  })
  @Expose()
  year!: number;

  @ApiPropertyOptional({
    description: 'Cor do veículo',
    example: 'Branco',
  })
  @Expose()
  color?: string;

  @ApiProperty({
    description: 'Tipo do veículo',
    enum: VehicleType,
    example: VehicleType.CAR,
  })
  @Expose()
  vehicle_type!: VehicleType;

  @ApiProperty({
    description: 'Status do veículo',
    enum: VehicleStatus,
    example: VehicleStatus.ACTIVE,
  })
  @Expose()
  status!: VehicleStatus;

  @ApiProperty({
    description: 'Tipo de combustível',
    enum: FuelType,
    example: FuelType.GASOLINE,
  })
  @Expose()
  fuel_type!: FuelType;

  @ApiPropertyOptional({
    description: 'Capacidade de carga em kg',
    example: 500.5,
  })
  @Expose()
  load_capacity?: number;

  @ApiPropertyOptional({
    description: 'Volume de carga em m³',
    example: 2.5,
  })
  @Expose()
  cargo_volume?: number;

  @ApiPropertyOptional({
    description: 'Capacidade do tanque em litros',
    example: 50.0,
  })
  @Expose()
  fuel_capacity?: number;

  @ApiProperty({
    description: 'Quilometragem atual',
    example: 15000,
  })
  @Expose()
  mileage!: number;

  @ApiPropertyOptional({
    description: 'Data da última manutenção',
    example: '2023-01-15T00:00:00.000Z',
  })
  @Expose()
  last_maintenance_at?: Date;

  @ApiPropertyOptional({
    description: 'Data da próxima manutenção programada',
    example: '2024-01-15T00:00:00.000Z',
  })
  @Expose()
  next_maintenance_at?: Date;

  @ApiPropertyOptional({
    description: 'Próxima manutenção em km',
    example: 20000,
  })
  @Expose()
  next_maintenance_km?: number;

  @ApiPropertyOptional({
    description: 'Número do chassi',
    example: '9BWZZZ377VT000000',
  })
  @Expose()
  chassis_number?: string;

  @ApiPropertyOptional({
    description: 'Número do RENAVAM',
    example: '12345678901',
  })
  @Expose()
  renavam?: string;

  @ApiPropertyOptional({
    description: 'Data de aquisição do veículo',
    example: '2023-01-15T00:00:00.000Z',
  })
  @Expose()
  acquisition_date?: Date;

  @ApiPropertyOptional({
    description: 'Valor de aquisição',
    example: 100000.0,
  })
  @Expose()
  acquisition_value?: number;

  @ApiPropertyOptional({
    description: 'Consumo médio em km/l',
    example: 12.5,
  })
  @Expose()
  average_consumption?: number;

  @ApiPropertyOptional({
    description: 'Seguradora',
    example: 'Seguradora XYZ',
  })
  @Expose()
  insurance_company?: string;

  @ApiPropertyOptional({
    description: 'Número da apólice de seguro',
    example: '123456789',
  })
  @Expose()
  insurance_policy_number?: string;

  @ApiPropertyOptional({
    description: 'Data de vencimento do seguro',
    example: '2024-12-31T00:00:00.000Z',
  })
  @Expose()
  insurance_expiry_date?: Date;

  @ApiPropertyOptional({
    description: 'Data de vencimento do licenciamento',
    example: '2024-12-31T00:00:00.000Z',
  })
  @Expose()
  license_expiry_date?: Date;

  @ApiPropertyOptional({
    description: 'Observações gerais',
    example: 'Veículo com ar condicionado e direção hidráulica',
  })
  @Expose()
  notes?: string;

  @ApiProperty({
    description: 'Possui rastreamento GPS',
    example: true,
  })
  @Expose()
  has_gps!: boolean;

  @ApiProperty({
    description: 'Possui refrigeração',
    example: false,
  })
  @Expose()
  has_refrigeration!: boolean;

  @ApiPropertyOptional({
    description: 'Informações de seguro',
    example: {
      company: 'Seguradora XYZ',
      policy_number: '123456789',
      expiry_date: '2024-12-31',
    },
  })
  @Expose()
  insurance_info?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Especificações técnicas adicionais',
    example: {
      engine: '2.0 Turbo',
      transmission: 'Automática',
      drivetrain: 'FWD',
    },
  })
  @Expose()
  specifications?: Record<string, unknown>;

  @ApiProperty({
    description: 'Data de criação',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Expose()
  created_at!: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2023-01-15T00:00:00.000Z',
  })
  @Expose()
  updated_at!: Date;

  @ApiPropertyOptional({
    description: 'Capacidade máxima de passageiros',
    example: 5,
  })
  @Expose()
  passenger_capacity?: number;

  @ApiPropertyOptional({
    description: 'Histórico de motoristas',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        driver_id: { type: 'string' },
        start_date: { type: 'string', format: 'date-time' },
        end_date: { type: 'string', format: 'date-time' },
        status: { type: 'string' },
      },
    },
  })
  @Expose()
  driver_history?: {
    id: string;
    driver_id: string;
    start_date: Date;
    end_date?: Date;
    status: string;
  }[];

  @ApiPropertyOptional({
    description: 'Incidentes relacionados ao veículo',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        severity: { type: 'string' },
        created_at: { type: 'string', format: 'date-time' },
      },
    },
  })
  @Expose()
  incidents?: {
    id: string;
    title: string;
    severity: string;
    created_at: Date;
  }[];

  // Propriedades computadas
  @ApiProperty({
    description: 'Indica se o veículo está disponível para uso',
    example: true,
  })
  @Expose()
  is_available!: boolean;

  @ApiProperty({
    description: 'Indica se o veículo precisa de manutenção',
    example: false,
  })
  @Expose()
  needs_maintenance!: boolean;

  @ApiProperty({
    description: 'Idade do veículo em anos',
    example: 1,
  })
  @Expose()
  age!: number;

  @ApiProperty({
    description: 'Indica se é um veículo elétrico',
    example: false,
  })
  @Expose()
  is_electric!: boolean;

  @ApiProperty({
    description: 'Identificação completa do veículo',
    example: 'Toyota Corolla (2023) - ABC-1234',
  })
  @Expose()
  full_identification!: string;
}
