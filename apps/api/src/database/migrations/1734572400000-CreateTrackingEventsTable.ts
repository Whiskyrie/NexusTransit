import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateTrackingEventsTable1734572400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Habilitar extensão PostGIS se ainda não estiver habilitada
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);

    // Criar enum para event_type
    await queryRunner.query(`
      CREATE TYPE "event_type_enum" AS ENUM (
        'CREATED',
        'ASSIGNED',
        'PICKUP_STARTED',
        'PICKED_UP',
        'IN_TRANSIT',
        'NEAR_DESTINATION',
        'ARRIVED',
        'DELIVERED',
        'FAILED',
        'CANCELED',
        'DELAYED',
        'RESCHEDULED'
      );
    `);

    // Criar enum para event_status
    await queryRunner.query(`
      CREATE TYPE "event_status_enum" AS ENUM (
        'SUCCESS',
        'WARNING',
        'ERROR',
        'INFO'
      );
    `);

    // Criar tabela tracking_events
    await queryRunner.createTable(
      new Table({
        name: 'tracking_events',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'event_id',
            type: 'uuid',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'delivery_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'route_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'driver_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'event_type',
            type: 'event_type_enum',
            isNullable: false,
          },
          {
            name: 'event_status',
            type: 'event_status_enum',
            isNullable: false,
          },
          {
            name: 'timestamp',
            type: 'timestamp with time zone',
            isNullable: false,
          },
          {
            name: 'location',
            type: 'geometry(Point, 4326)',
            isNullable: true,
          },
          {
            name: 'location_address',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'accuracy',
            type: 'float',
            isNullable: true,
          },
          {
            name: 'speed',
            type: 'float',
            isNullable: true,
          },
          {
            name: 'battery_level',
            type: 'float',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'is_automatic',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_by_user_id',
            type: 'uuid',
            isNullable: true,
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
      'tracking_events',
      new TableIndex({
        name: 'IDX_tracking_events_delivery_timestamp',
        columnNames: ['delivery_id', 'timestamp'],
      }),
    );

    await queryRunner.createIndex(
      'tracking_events',
      new TableIndex({
        name: 'IDX_tracking_events_driver_timestamp',
        columnNames: ['driver_id', 'timestamp'],
      }),
    );

    await queryRunner.createIndex(
      'tracking_events',
      new TableIndex({
        name: 'IDX_tracking_events_route_timestamp',
        columnNames: ['route_id', 'timestamp'],
      }),
    );

    await queryRunner.createIndex(
      'tracking_events',
      new TableIndex({
        name: 'IDX_tracking_events_event_type',
        columnNames: ['event_type'],
      }),
    );

    await queryRunner.createIndex(
      'tracking_events',
      new TableIndex({
        name: 'IDX_tracking_events_event_status',
        columnNames: ['event_status'],
      }),
    );

    // Criar índice espacial para location (PostGIS)
    await queryRunner.query(`
      CREATE INDEX "IDX_tracking_events_location" 
      ON "tracking_events" 
      USING GIST ("location");
    `);

    // Criar foreign keys
    await queryRunner.createForeignKey(
      'tracking_events',
      new TableForeignKey({
        columnNames: ['delivery_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'deliveries',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'tracking_events',
      new TableForeignKey({
        columnNames: ['route_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'routes',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'tracking_events',
      new TableForeignKey({
        columnNames: ['driver_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'drivers',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );

    // Adicionar comentários
    await queryRunner.query(`
      COMMENT ON TABLE "tracking_events" IS 'Eventos de rastreamento de entregas com suporte a geolocalização PostGIS';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "tracking_events"."location" IS 'Coordenadas geográficas do evento (PostGIS Point com SRID 4326)';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover foreign keys
    const table = await queryRunner.getTable('tracking_events');
    if (table) {
      const foreignKeys = table.foreignKeys;
      for (const foreignKey of foreignKeys) {
        await queryRunner.dropForeignKey('tracking_events', foreignKey);
      }
    }

    // Remover índices
    await queryRunner.dropIndex('tracking_events', 'IDX_tracking_events_location');
    await queryRunner.dropIndex('tracking_events', 'IDX_tracking_events_event_status');
    await queryRunner.dropIndex('tracking_events', 'IDX_tracking_events_event_type');
    await queryRunner.dropIndex('tracking_events', 'IDX_tracking_events_route_timestamp');
    await queryRunner.dropIndex('tracking_events', 'IDX_tracking_events_driver_timestamp');
    await queryRunner.dropIndex('tracking_events', 'IDX_tracking_events_delivery_timestamp');

    // Remover tabela
    await queryRunner.dropTable('tracking_events');

    // Remover enums
    await queryRunner.query(`DROP TYPE IF EXISTS "event_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "event_type_enum";`);
  }
}
