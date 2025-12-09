import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateServiceOrdersTable1733788800001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enums
    await queryRunner.query(`
      CREATE TYPE "order_status_enum" AS ENUM (
        'PENDING',
        'SCHEDULED',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED',
        'DELIVERED',
        'FAILED'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "order_priority_enum" AS ENUM (
        'LOW',
        'NORMAL',
        'HIGH',
        'URGENT'
      )
    `);

    // Criar tabela service_orders
    await queryRunner.createTable(
      new Table({
        name: 'service_orders',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
            comment: 'ID único da ordem de serviço',
          },
          {
            name: 'order_number',
            type: 'varchar',
            length: '20',
            isUnique: true,
            isNullable: false,
            comment: 'Número único da ordem de serviço (ex: OS-2024-00001)',
          },
          {
            name: 'status',
            type: 'order_status_enum',
            default: "'PENDING'",
            isNullable: false,
            comment: 'Status atual da ordem de serviço',
          },
          {
            name: 'priority',
            type: 'order_priority_enum',
            default: "'NORMAL'",
            isNullable: false,
            comment: 'Prioridade da ordem de serviço',
          },
          {
            name: 'service_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'Tipo de serviço (MAINTENANCE, DELIVERY, PICKUP, INSPECTION, etc)',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '200',
            isNullable: false,
            comment: 'Título resumido da ordem de serviço',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
            comment: 'Descrição detalhada do serviço a ser executado',
          },
          {
            name: 'vehicle_id',
            type: 'uuid',
            isNullable: true,
            comment: 'ID do veículo associado (se aplicável)',
          },
          {
            name: 'driver_id',
            type: 'uuid',
            isNullable: true,
            comment: 'ID do motorista responsável (se aplicável)',
          },
          {
            name: 'scheduled_date',
            type: 'timestamp',
            isNullable: true,
            comment: 'Data e hora agendada para execução',
          },
          {
            name: 'started_at',
            type: 'timestamp',
            isNullable: true,
            comment: 'Data e hora de início da execução',
          },
          {
            name: 'completed_at',
            type: 'timestamp',
            isNullable: true,
            comment: 'Data e hora de conclusão',
          },
          {
            name: 'cancelled_at',
            type: 'timestamp',
            isNullable: true,
            comment: 'Data e hora de cancelamento',
          },
          {
            name: 'estimated_cost',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
            isNullable: false,
            comment: 'Custo estimado do serviço',
          },
          {
            name: 'actual_cost',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
            comment: 'Custo real do serviço executado',
          },
          {
            name: 'estimated_duration_minutes',
            type: 'integer',
            isNullable: true,
            comment: 'Tempo estimado em minutos',
          },
          {
            name: 'actual_duration_minutes',
            type: 'integer',
            isNullable: true,
            comment: 'Tempo real de execução em minutos',
          },
          {
            name: 'service_location',
            type: 'varchar',
            length: '500',
            isNullable: true,
            comment: 'Endereço onde o serviço será executado',
          },
          {
            name: 'latitude',
            type: 'decimal',
            precision: 10,
            scale: 7,
            isNullable: true,
            comment: 'Latitude do local do serviço',
          },
          {
            name: 'longitude',
            type: 'decimal',
            precision: 10,
            scale: 7,
            isNullable: true,
            comment: 'Longitude do local do serviço',
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
            comment: 'Observações gerais sobre a ordem',
          },
          {
            name: 'cancellation_reason',
            type: 'text',
            isNullable: true,
            comment: 'Motivo do cancelamento (se aplicável)',
          },
          {
            name: 'completion_report',
            type: 'text',
            isNullable: true,
            comment: 'Resultado ou relatório final da execução',
          },
          {
            name: 'created_by',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Usuário que criou a ordem',
          },
          {
            name: 'updated_by',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Usuário que atualizou pela última vez',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Dados adicionais em formato JSON',
          },
          {
            name: 'checklist',
            type: 'jsonb',
            isNullable: true,
            comment: 'Lista de itens do checklist',
          },
          {
            name: 'attachments',
            type: 'jsonb',
            isNullable: true,
            comment: 'Anexos/documentos relacionados',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
            comment: 'Data de criação do registro',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
            comment: 'Data da última atualização',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
            comment: 'Data de exclusão lógica (soft delete)',
          },
        ],
      }),
      true,
    );

    // Criar índices
    await queryRunner.createIndex(
      'service_orders',
      new TableIndex({
        name: 'IDX_SERVICE_ORDERS_ORDER_NUMBER',
        columnNames: ['order_number'],
      }),
    );

    await queryRunner.createIndex(
      'service_orders',
      new TableIndex({
        name: 'IDX_SERVICE_ORDERS_STATUS',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'service_orders',
      new TableIndex({
        name: 'IDX_SERVICE_ORDERS_PRIORITY',
        columnNames: ['priority'],
      }),
    );

    await queryRunner.createIndex(
      'service_orders',
      new TableIndex({
        name: 'IDX_SERVICE_ORDERS_VEHICLE_ID',
        columnNames: ['vehicle_id'],
      }),
    );

    await queryRunner.createIndex(
      'service_orders',
      new TableIndex({
        name: 'IDX_SERVICE_ORDERS_DRIVER_ID',
        columnNames: ['driver_id'],
      }),
    );

    await queryRunner.createIndex(
      'service_orders',
      new TableIndex({
        name: 'IDX_SERVICE_ORDERS_SCHEDULED_DATE',
        columnNames: ['scheduled_date'],
      }),
    );

    await queryRunner.createIndex(
      'service_orders',
      new TableIndex({
        name: 'IDX_SERVICE_ORDERS_SERVICE_TYPE',
        columnNames: ['service_type'],
      }),
    );

    // Criar foreign keys
    await queryRunner.createForeignKey(
      'service_orders',
      new TableForeignKey({
        name: 'FK_SERVICE_ORDERS_VEHICLE',
        columnNames: ['vehicle_id'],
        referencedTableName: 'vehicles',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'service_orders',
      new TableForeignKey({
        name: 'FK_SERVICE_ORDERS_DRIVER',
        columnNames: ['driver_id'],
        referencedTableName: 'drivers',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );

    // Criar trigger para atualizar updated_at automaticamente
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_service_orders_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TRIGGER trigger_update_service_orders_updated_at
      BEFORE UPDATE ON service_orders
      FOR EACH ROW
      EXECUTE FUNCTION update_service_orders_updated_at();
    `);

    // Comentário na tabela
    await queryRunner.query(`
      COMMENT ON TABLE service_orders IS 'Gerenciamento de ordens de serviço para manutenção, entregas especiais, coletas e inspeções';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover trigger
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trigger_update_service_orders_updated_at ON service_orders`,
    );
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_service_orders_updated_at()`);

    // Remover foreign keys
    await queryRunner.dropForeignKey('service_orders', 'FK_SERVICE_ORDERS_DRIVER');
    await queryRunner.dropForeignKey('service_orders', 'FK_SERVICE_ORDERS_VEHICLE');

    // Remover índices
    await queryRunner.dropIndex('service_orders', 'IDX_SERVICE_ORDERS_SERVICE_TYPE');
    await queryRunner.dropIndex('service_orders', 'IDX_SERVICE_ORDERS_SCHEDULED_DATE');
    await queryRunner.dropIndex('service_orders', 'IDX_SERVICE_ORDERS_DRIVER_ID');
    await queryRunner.dropIndex('service_orders', 'IDX_SERVICE_ORDERS_VEHICLE_ID');
    await queryRunner.dropIndex('service_orders', 'IDX_SERVICE_ORDERS_PRIORITY');
    await queryRunner.dropIndex('service_orders', 'IDX_SERVICE_ORDERS_STATUS');
    await queryRunner.dropIndex('service_orders', 'IDX_SERVICE_ORDERS_ORDER_NUMBER');

    // Remover tabela
    await queryRunner.dropTable('service_orders');

    // Remover enums
    await queryRunner.query(`DROP TYPE IF EXISTS "order_priority_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "order_status_enum"`);
  }
}
