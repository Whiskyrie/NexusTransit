import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateDeliveriesTable1694544000019 implements MigrationInterface {
  name = 'CreateDeliveriesTable1694544000019';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enums
    await queryRunner.query(`
      CREATE TYPE "delivery_status_enum" AS ENUM (
        'PENDING',
        'CONFIRMED',
        'ASSIGNED',
        'IN_TRANSIT',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'FAILED',
        'CANCELLED'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "delivery_priority_enum" AS ENUM (
        'LOW',
        'NORMAL',
        'HIGH',
        'CRITICAL'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "failure_reason_enum" AS ENUM (
        'RECIPIENT_ABSENT',
        'ADDRESS_NOT_FOUND',
        'RECIPIENT_REFUSED',
        'INCORRECT_ADDRESS',
        'BUSINESS_CLOSED',
        'SECURITY_RESTRICTION',
        'WEATHER_CONDITIONS',
        'VEHICLE_BREAKDOWN',
        'TRAFFIC_ACCIDENT',
        'DAMAGED_PACKAGE',
        'INCORRECT_DOCUMENTATION',
        'ACCESS_DENIED',
        'RECIPIENT_UNAVAILABLE',
        'OTHER'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "proof_type_enum" AS ENUM (
        'SIGNATURE',
        'PHOTO',
        'VIDEO',
        'AUDIO',
        'GPS_LOCATION',
        'QR_CODE',
        'BARCODE',
        'BIOMETRIC_FINGERPRINT',
        'BIOMETRIC_FACIAL',
        'DIGITAL_SIGNATURE',
        'DELIVERY_CODE',
        'COMBINED'
      )
    `);

    // Criar tabela deliveries
    await queryRunner.createTable(
      new Table({
        name: 'deliveries',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tracking_code',
            type: 'varchar',
            length: '50',
            isUnique: true,
            comment: 'Código único de rastreamento da entrega',
          },
          {
            name: 'customer_id',
            type: 'uuid',
            comment: 'ID do cliente que solicitou a entrega',
          },
          {
            name: 'driver_id',
            type: 'uuid',
            isNullable: true,
            comment: 'ID do motorista responsável pela entrega',
          },
          {
            name: 'vehicle_id',
            type: 'uuid',
            isNullable: true,
            comment: 'ID do veículo utilizado na entrega',
          },
          {
            name: 'status',
            type: 'delivery_status_enum',
            default: "'PENDING'",
            comment: 'Status atual da entrega',
          },
          {
            name: 'priority',
            type: 'delivery_priority_enum',
            default: "'NORMAL'",
            comment: 'Prioridade da entrega',
          },
          {
            name: 'pickup_address',
            type: 'jsonb',
            comment:
              'Endereço de coleta (JSON com street, number, complement, neighborhood, city, state, zip_code, country, coordinates)',
          },
          {
            name: 'delivery_address',
            type: 'jsonb',
            comment:
              'Endereço de entrega (JSON com street, number, complement, neighborhood, city, state, zip_code, country, coordinates)',
          },
          {
            name: 'pickup_contact',
            type: 'jsonb',
            isNullable: true,
            comment: 'Contato no local de coleta (JSON com name, phone, email)',
          },
          {
            name: 'delivery_contact',
            type: 'jsonb',
            comment: 'Contato no local de entrega (JSON com name, phone, email)',
          },
          {
            name: 'product_info',
            type: 'jsonb',
            comment:
              'Informações do produto (JSON com description, quantity, category, value, weight, dimensions)',
          },
          {
            name: 'special_instructions',
            type: 'text',
            isNullable: true,
            comment: 'Instruções especiais para a entrega',
          },
          {
            name: 'scheduled_pickup_at',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'Data/hora agendada para coleta',
          },
          {
            name: 'scheduled_delivery_at',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'Data/hora agendada para entrega',
          },
          {
            name: 'actual_pickup_at',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'Data/hora real da coleta',
          },
          {
            name: 'actual_delivery_at',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'Data/hora real da entrega',
          },
          {
            name: 'estimated_distance_km',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
            comment: 'Distância estimada em km',
          },
          {
            name: 'actual_distance_km',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
            comment: 'Distância real percorrida em km',
          },
          {
            name: 'estimated_duration_minutes',
            type: 'integer',
            isNullable: true,
            comment: 'Duração estimada em minutos',
          },
          {
            name: 'actual_duration_minutes',
            type: 'integer',
            isNullable: true,
            comment: 'Duração real em minutos',
          },
          {
            name: 'delivery_fee',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
            comment: 'Taxa de entrega',
          },
          {
            name: 'additional_fees',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
            default: 0,
            comment: 'Taxas adicionais',
          },
          {
            name: 'total_cost',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
            comment: 'Custo total da entrega',
          },
          {
            name: 'requires_signature',
            type: 'boolean',
            default: false,
            comment: 'Requer assinatura do destinatário',
          },
          {
            name: 'requires_photo',
            type: 'boolean',
            default: false,
            comment: 'Requer foto como comprovante',
          },
          {
            name: 'requires_id_verification',
            type: 'boolean',
            default: false,
            comment: 'Requer verificação de identidade',
          },
          {
            name: 'allows_partial_delivery',
            type: 'boolean',
            default: false,
            comment: 'Permite entrega parcial',
          },
          {
            name: 'fragile_content',
            type: 'boolean',
            default: false,
            comment: 'Conteúdo frágil',
          },
          {
            name: 'temperature_controlled',
            type: 'boolean',
            default: false,
            comment: 'Requer controle de temperatura',
          },
          {
            name: 'insurance_required',
            type: 'boolean',
            default: false,
            comment: 'Requer seguro',
          },
          {
            name: 'insurance_value',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
            comment: 'Valor do seguro',
          },
          {
            name: 'failure_reason',
            type: 'failure_reason_enum',
            isNullable: true,
            comment: 'Motivo da falha na entrega',
          },
          {
            name: 'failure_notes',
            type: 'text',
            isNullable: true,
            comment: 'Observações sobre a falha',
          },
          {
            name: 'attempts_count',
            type: 'integer',
            default: 0,
            comment: 'Número de tentativas de entrega',
          },
          {
            name: 'max_attempts',
            type: 'integer',
            default: 3,
            comment: 'Número máximo de tentativas permitidas',
          },
          {
            name: 'notification_settings',
            type: 'jsonb',
            isNullable: true,
            comment: 'Configurações de notificação (JSON com sms, email, push, whatsapp)',
          },
          {
            name: 'tracking_data',
            type: 'jsonb',
            isNullable: true,
            comment: 'Dados de rastreamento em tempo real (JSON com location_history, events)',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Dados adicionais customizáveis',
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

    // Criar índices
    await queryRunner.createIndex(
      'deliveries',
      new TableIndex({
        name: 'IDX_DELIVERY_TRACKING_CODE',
        columnNames: ['tracking_code'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'deliveries',
      new TableIndex({
        name: 'IDX_DELIVERY_STATUS',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'deliveries',
      new TableIndex({
        name: 'IDX_DELIVERY_PRIORITY',
        columnNames: ['priority'],
      }),
    );

    await queryRunner.createIndex(
      'deliveries',
      new TableIndex({
        name: 'IDX_DELIVERY_CUSTOMER',
        columnNames: ['customer_id'],
      }),
    );

    await queryRunner.createIndex(
      'deliveries',
      new TableIndex({
        name: 'IDX_DELIVERY_DRIVER',
        columnNames: ['driver_id'],
      }),
    );

    await queryRunner.createIndex(
      'deliveries',
      new TableIndex({
        name: 'IDX_DELIVERY_VEHICLE',
        columnNames: ['vehicle_id'],
      }),
    );

    await queryRunner.createIndex(
      'deliveries',
      new TableIndex({
        name: 'IDX_DELIVERY_SCHEDULED_AT',
        columnNames: ['scheduled_delivery_at'],
      }),
    );

    await queryRunner.createIndex(
      'deliveries',
      new TableIndex({
        name: 'IDX_DELIVERY_CREATED_AT',
        columnNames: ['created_at'],
      }),
    );

    await queryRunner.createIndex(
      'deliveries',
      new TableIndex({
        name: 'IDX_DELIVERY_DELETED_AT',
        columnNames: ['deleted_at'],
      }),
    );

    // Índices compostos para consultas comuns
    await queryRunner.createIndex(
      'deliveries',
      new TableIndex({
        name: 'IDX_DELIVERY_STATUS_DRIVER',
        columnNames: ['status', 'driver_id'],
      }),
    );

    await queryRunner.createIndex(
      'deliveries',
      new TableIndex({
        name: 'IDX_DELIVERY_STATUS_CUSTOMER',
        columnNames: ['status', 'customer_id'],
      }),
    );

    // Criar foreign keys
    await queryRunner.createForeignKey(
      'deliveries',
      new TableForeignKey({
        name: 'FK_DELIVERY_CUSTOMER',
        columnNames: ['customer_id'],
        referencedTableName: 'customers',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'deliveries',
      new TableForeignKey({
        name: 'FK_DELIVERY_DRIVER',
        columnNames: ['driver_id'],
        referencedTableName: 'drivers',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'deliveries',
      new TableForeignKey({
        name: 'FK_DELIVERY_VEHICLE',
        columnNames: ['vehicle_id'],
        referencedTableName: 'vehicles',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover foreign keys
    await queryRunner.dropForeignKey('deliveries', 'FK_DELIVERY_VEHICLE');
    await queryRunner.dropForeignKey('deliveries', 'FK_DELIVERY_DRIVER');
    await queryRunner.dropForeignKey('deliveries', 'FK_DELIVERY_CUSTOMER');

    // Remover índices
    await queryRunner.dropIndex('deliveries', 'IDX_DELIVERY_STATUS_CUSTOMER');
    await queryRunner.dropIndex('deliveries', 'IDX_DELIVERY_STATUS_DRIVER');
    await queryRunner.dropIndex('deliveries', 'IDX_DELIVERY_DELETED_AT');
    await queryRunner.dropIndex('deliveries', 'IDX_DELIVERY_CREATED_AT');
    await queryRunner.dropIndex('deliveries', 'IDX_DELIVERY_SCHEDULED_AT');
    await queryRunner.dropIndex('deliveries', 'IDX_DELIVERY_VEHICLE');
    await queryRunner.dropIndex('deliveries', 'IDX_DELIVERY_DRIVER');
    await queryRunner.dropIndex('deliveries', 'IDX_DELIVERY_CUSTOMER');
    await queryRunner.dropIndex('deliveries', 'IDX_DELIVERY_PRIORITY');
    await queryRunner.dropIndex('deliveries', 'IDX_DELIVERY_STATUS');
    await queryRunner.dropIndex('deliveries', 'IDX_DELIVERY_TRACKING_CODE');

    // Remover tabela
    await queryRunner.dropTable('deliveries');

    // Remover enums
    await queryRunner.query('DROP TYPE "proof_type_enum"');
    await queryRunner.query('DROP TYPE "failure_reason_enum"');
    await queryRunner.query('DROP TYPE "delivery_priority_enum"');
    await queryRunner.query('DROP TYPE "delivery_status_enum"');
  }
}
