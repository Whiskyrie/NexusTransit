import { type MigrationInterface, type QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateVehiclesTable1694544000003 implements MigrationInterface {
  name = 'CreateVehiclesTable1694544000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enums
    await queryRunner.query(`
      CREATE TYPE "vehicle_status_enum" AS ENUM (
        'active',
        'inactive', 
        'maintenance',
        'out_of_service'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "vehicle_type_enum" AS ENUM (
        'truck',
        'van',
        'motorcycle',
        'car',
        'cargo_bike'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "fuel_type_enum" AS ENUM (
        'gasoline',
        'diesel',
        'electric',
        'hybrid',
        'cng'
      )
    `);

    // Criar tabela vehicles
    await queryRunner.createTable(
      new Table({
        name: 'vehicles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'license_plate',
            type: 'varchar',
            length: '20',
            isUnique: true,
            comment: 'Placa do veículo',
          },
          {
            name: 'brand',
            type: 'varchar',
            length: '100',
            comment: 'Marca do veículo',
          },
          {
            name: 'model',
            type: 'varchar',
            length: '100',
            comment: 'Modelo do veículo',
          },
          {
            name: 'year',
            type: 'integer',
            comment: 'Ano de fabricação',
          },
          {
            name: 'color',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Cor do veículo',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['truck', 'van', 'motorcycle', 'car', 'cargo_bike'],
            comment: 'Tipo do veículo',
          },
          {
            name: 'fuel_type',
            type: 'enum',
            enum: ['gasoline', 'diesel', 'electric', 'hybrid', 'cng'],
            comment: 'Tipo de combustível',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive', 'maintenance', 'out_of_service'],
            default: "'active'",
            comment: 'Status atual do veículo',
          },
          {
            name: 'cargo_capacity_kg',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
            comment: 'Capacidade de carga em kg',
          },
          {
            name: 'cargo_volume_m3',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
            comment: 'Volume de carga em m³',
          },
          {
            name: 'fuel_consumption_kml',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
            comment: 'Consumo médio de combustível (km/l)',
          },
          {
            name: 'current_mileage',
            type: 'integer',
            default: 0,
            comment: 'Quilometragem atual',
          },
          {
            name: 'last_maintenance_date',
            type: 'date',
            isNullable: true,
            comment: 'Data da última manutenção',
          },
          {
            name: 'next_maintenance_mileage',
            type: 'integer',
            isNullable: true,
            comment: 'Quilometragem da próxima manutenção',
          },
          {
            name: 'documentation_expiry_date',
            type: 'date',
            isNullable: true,
            comment: 'Data de vencimento da documentação',
          },
          {
            name: 'chassis_number',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Número do chassi',
          },
          {
            name: 'renavam',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Número do RENAVAM',
          },
          {
            name: 'installed_devices',
            type: 'jsonb',
            isNullable: true,
            comment: 'Dispositivos instalados (GPS, sensor, etc.)',
          },
          {
            name: 'settings',
            type: 'jsonb',
            isNullable: true,
            comment: 'Configurações específicas do veículo',
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
            comment: 'Observações sobre o veículo',
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Criar índices para melhor performance
    await queryRunner.createIndex(
      'vehicles',
      new TableIndex({
        name: 'idx_vehicles_license_plate',
        columnNames: ['license_plate'],
      }),
    );

    await queryRunner.createIndex(
      'vehicles',
      new TableIndex({
        name: 'idx_vehicles_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'vehicles',
      new TableIndex({
        name: 'idx_vehicles_type',
        columnNames: ['type'],
      }),
    );

    await queryRunner.createIndex(
      'vehicles',
      new TableIndex({
        name: 'idx_vehicles_brand_model',
        columnNames: ['brand', 'model'],
      }),
    );

    await queryRunner.createIndex(
      'vehicles',
      new TableIndex({
        name: 'idx_vehicles_maintenance',
        columnNames: ['next_maintenance_mileage'],
      }),
    );

    // Comentário na tabela
    await queryRunner.query(`
      COMMENT ON TABLE "vehicles" IS 'Sistema de gerenciamento de veículos da frota'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover tabela vehicles
    await queryRunner.dropTable('vehicles');

    // Remover enums
    await queryRunner.query('DROP TYPE IF EXISTS "vehicle_status_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "vehicle_type_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "fuel_type_enum"');
  }
}
