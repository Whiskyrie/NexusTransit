import { type MigrationInterface, type QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateIncidentsTable1766110600000 implements MigrationInterface {
  name = 'CreateIncidentsTable1766110600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tipos ENUM
    await queryRunner.query(`
      CREATE TYPE "incidents_incident_type_enum" AS ENUM(
        'TRAFFIC_ACCIDENT',
        'VEHICLE_BREAKDOWN', 
        'DELAYED_TRAFFIC',
        'CUSTOMER_NOT_FOUND',
        'WRONG_ADDRESS',
        'REFUSED_DELIVERY',
        'THEFT',
        'DAMAGE',
        'WEATHER',
        'OTHER'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "incidents_severity_enum" AS ENUM(
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "incidents_status_enum" AS ENUM(
        'REPORTED',
        'INVESTIGATING',
        'IN_PROGRESS',
        'RESOLVED',
        'CLOSED',
        'ESCALATED'
      )
    `);

    // Criar tabela incidents
    await queryRunner.createTable(
      new Table({
        name: 'incidents',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'deleted_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'incident_number',
            type: 'varchar',
            length: '50',
            isUnique: true,
            comment: 'Número único do incidente gerado automaticamente',
          },
          {
            name: 'delivery_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'route_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'driver_id',
            type: 'uuid',
          },
          {
            name: 'vehicle_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'incident_type',
            type: 'incidents_incident_type_enum',
            comment: 'Tipo do incidente',
          },
          {
            name: 'severity',
            type: 'incidents_severity_enum',
            comment: 'Severidade do incidente',
          },
          {
            name: 'status',
            type: 'incidents_status_enum',
            default: "'REPORTED'",
            comment: 'Status atual do incidente',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '200',
            comment: 'Título breve do incidente',
          },
          {
            name: 'description',
            type: 'text',
            comment: 'Descrição detalhada do incidente',
          },
          {
            name: 'location',
            type: 'geometry',
            spatialFeatureType: 'Point',
            srid: 4326,
            isNullable: true,
            comment: 'Localização geográfica do incidente (PostGIS Point)',
          },
          {
            name: 'location_address',
            type: 'varchar',
            length: '500',
            isNullable: true,
            comment: 'Endereço formatado do local do incidente',
          },
          {
            name: 'reported_at',
            type: 'timestamptz',
            default: 'now()',
            comment: 'Data e hora do registro do incidente',
          },
          {
            name: 'occurred_at',
            type: 'timestamptz',
            isNullable: true,
            comment: 'Data e hora da ocorrência do incidente',
          },
          {
            name: 'resolved_at',
            type: 'timestamptz',
            isNullable: true,
            comment: 'Data e hora da resolução do incidente',
          },
          {
            name: 'reported_by_user_id',
            type: 'uuid',
          },
          {
            name: 'assigned_to_user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'resolution_notes',
            type: 'text',
            isNullable: true,
            comment: 'Notas sobre a resolução do incidente',
          },
          {
            name: 'estimated_loss',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
            comment: 'Estimativa de prejuízo financeiro',
          },
          {
            name: 'impact_on_delivery',
            type: 'boolean',
            default: false,
            comment: 'Indica se o incidente afetou entregas',
          },
          {
            name: 'requires_insurance',
            type: 'boolean',
            default: false,
            comment: 'Indica se é necessário acionar seguro',
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
            comment: 'Observações gerais sobre o incidente',
          },
        ],
      }),
      true,
    );

    // Criar índices
    await queryRunner.createIndex(
      'incidents',
      new TableIndex({
        name: 'IDX_incidents_incident_number',
        columnNames: ['incident_number'],
      }),
    );

    await queryRunner.createIndex(
      'incidents',
      new TableIndex({
        name: 'IDX_incidents_incident_type',
        columnNames: ['incident_type'],
      }),
    );

    await queryRunner.createIndex(
      'incidents',
      new TableIndex({
        name: 'IDX_incidents_severity',
        columnNames: ['severity'],
      }),
    );

    await queryRunner.createIndex(
      'incidents',
      new TableIndex({
        name: 'IDX_incidents_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'incidents',
      new TableIndex({
        name: 'IDX_incidents_driver_id',
        columnNames: ['driver_id'],
      }),
    );

    await queryRunner.createIndex(
      'incidents',
      new TableIndex({
        name: 'IDX_incidents_reported_at',
        columnNames: ['reported_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.dropIndex('incidents', 'IDX_incidents_reported_at');
    await queryRunner.dropIndex('incidents', 'IDX_incidents_driver_id');
    await queryRunner.dropIndex('incidents', 'IDX_incidents_status');
    await queryRunner.dropIndex('incidents', 'IDX_incidents_severity');
    await queryRunner.dropIndex('incidents', 'IDX_incidents_incident_type');
    await queryRunner.dropIndex('incidents', 'IDX_incidents_incident_number');

    // Remover tabela
    await queryRunner.dropTable('incidents');

    // Remover tipos ENUM
    await queryRunner.query(`DROP TYPE "incidents_status_enum"`);
    await queryRunner.query(`DROP TYPE "incidents_severity_enum"`);
    await queryRunner.query(`DROP TYPE "incidents_incident_type_enum"`);
  }
}
