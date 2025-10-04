import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateDeliveryStatusHistoryTable1694544000022 implements MigrationInterface {
  name = 'CreateDeliveryStatusHistoryTable1694544000022';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela delivery_status_history
    await queryRunner.createTable(
      new Table({
        name: 'delivery_status_history',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'delivery_id',
            type: 'uuid',
            comment: 'ID da entrega',
          },
          {
            name: 'previous_status',
            type: 'delivery_status_enum',
            isNullable: true,
            comment: 'Status anterior',
          },
          {
            name: 'new_status',
            type: 'delivery_status_enum',
            comment: 'Novo status',
          },
          {
            name: 'changed_by',
            type: 'uuid',
            isNullable: true,
            comment: 'ID do usuário/motorista que realizou a mudança',
          },
          {
            name: 'changed_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Data/hora da mudança',
          },
          {
            name: 'reason',
            type: 'text',
            isNullable: true,
            comment: 'Motivo da mudança de status',
          },
          {
            name: 'context',
            type: 'jsonb',
            isNullable: true,
            comment: 'Contexto adicional da mudança (JSON com location, device_info, app_version)',
          },
          {
            name: 'notification_sent',
            type: 'boolean',
            default: false,
            comment: 'Indica se notificação foi enviada',
          },
          {
            name: 'notification_channels',
            type: 'jsonb',
            isNullable: true,
            comment: 'Canais de notificação utilizados (JSON com sms, email, push, whatsapp)',
          },
          {
            name: 'notification_sent_at',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'Data/hora do envio da notificação',
          },
          {
            name: 'status_metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Metadados específicos do status (JSON variável por tipo de status)',
          },
          {
            name: 'impact_analysis',
            type: 'jsonb',
            isNullable: true,
            comment:
              'Análise de impacto da mudança (JSON com sla_impact, cost_impact, customer_satisfaction)',
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
      'delivery_status_history',
      new TableIndex({
        name: 'IDX_STATUS_HISTORY_DELIVERY',
        columnNames: ['delivery_id'],
      }),
    );

    await queryRunner.createIndex(
      'delivery_status_history',
      new TableIndex({
        name: 'IDX_STATUS_HISTORY_NEW_STATUS',
        columnNames: ['new_status'],
      }),
    );

    await queryRunner.createIndex(
      'delivery_status_history',
      new TableIndex({
        name: 'IDX_STATUS_HISTORY_CHANGED_BY',
        columnNames: ['changed_by'],
      }),
    );

    await queryRunner.createIndex(
      'delivery_status_history',
      new TableIndex({
        name: 'IDX_STATUS_HISTORY_CHANGED_AT',
        columnNames: ['changed_at'],
      }),
    );

    await queryRunner.createIndex(
      'delivery_status_history',
      new TableIndex({
        name: 'IDX_STATUS_HISTORY_NOTIFICATION',
        columnNames: ['notification_sent'],
      }),
    );

    // Índice composto para auditoria completa
    await queryRunner.createIndex(
      'delivery_status_history',
      new TableIndex({
        name: 'IDX_STATUS_HISTORY_DELIVERY_TIME',
        columnNames: ['delivery_id', 'changed_at'],
      }),
    );

    // Índice para buscar mudanças de status específicas
    await queryRunner.createIndex(
      'delivery_status_history',
      new TableIndex({
        name: 'IDX_STATUS_HISTORY_TRANSITION',
        columnNames: ['previous_status', 'new_status'],
      }),
    );

    // Criar foreign keys
    await queryRunner.createForeignKey(
      'delivery_status_history',
      new TableForeignKey({
        name: 'FK_STATUS_HISTORY_DELIVERY',
        columnNames: ['delivery_id'],
        referencedTableName: 'deliveries',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'delivery_status_history',
      new TableForeignKey({
        name: 'FK_STATUS_HISTORY_CHANGED_BY',
        columnNames: ['changed_by'],
        referencedTableName: 'drivers',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover foreign keys
    await queryRunner.dropForeignKey('delivery_status_history', 'FK_STATUS_HISTORY_CHANGED_BY');
    await queryRunner.dropForeignKey('delivery_status_history', 'FK_STATUS_HISTORY_DELIVERY');

    // Remover índices
    await queryRunner.dropIndex('delivery_status_history', 'IDX_STATUS_HISTORY_TRANSITION');
    await queryRunner.dropIndex('delivery_status_history', 'IDX_STATUS_HISTORY_DELIVERY_TIME');
    await queryRunner.dropIndex('delivery_status_history', 'IDX_STATUS_HISTORY_NOTIFICATION');
    await queryRunner.dropIndex('delivery_status_history', 'IDX_STATUS_HISTORY_CHANGED_AT');
    await queryRunner.dropIndex('delivery_status_history', 'IDX_STATUS_HISTORY_CHANGED_BY');
    await queryRunner.dropIndex('delivery_status_history', 'IDX_STATUS_HISTORY_NEW_STATUS');
    await queryRunner.dropIndex('delivery_status_history', 'IDX_STATUS_HISTORY_DELIVERY');

    // Remover tabela
    await queryRunner.dropTable('delivery_status_history');
  }
}
