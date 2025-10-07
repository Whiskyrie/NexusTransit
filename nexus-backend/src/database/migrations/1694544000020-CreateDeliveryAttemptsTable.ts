import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateDeliveryAttemptsTable1694544000020 implements MigrationInterface {
  name = 'CreateDeliveryAttemptsTable1694544000020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela delivery_attempts
    await queryRunner.createTable(
      new Table({
        name: 'delivery_attempts',
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
            name: 'driver_id',
            type: 'uuid',
            comment: 'ID do motorista que fez a tentativa',
          },
          {
            name: 'attempt_number',
            type: 'integer',
            comment: 'Número da tentativa',
          },
          {
            name: 'attempt_date',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Data/hora da tentativa',
          },
          {
            name: 'result',
            type: 'varchar',
            length: '50',
            comment: 'Resultado da tentativa (SUCCESS, FAILED, RESCHEDULED)',
          },
          {
            name: 'failure_reason',
            type: 'failure_reason_enum',
            isNullable: true,
            comment: 'Motivo da falha se não foi bem-sucedida',
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
            comment: 'Observações sobre a tentativa',
          },
          {
            name: 'location_latitude',
            type: 'decimal',
            precision: 10,
            scale: 8,
            isNullable: true,
            comment: 'Latitude do local da tentativa',
          },
          {
            name: 'location_longitude',
            type: 'decimal',
            precision: 11,
            scale: 8,
            isNullable: true,
            comment: 'Longitude do local da tentativa',
          },
          {
            name: 'location_accuracy',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
            comment: 'Precisão da localização em metros',
          },
          {
            name: 'evidence',
            type: 'jsonb',
            isNullable: true,
            comment: 'Evidências da tentativa (JSON com photos, videos, gps_track)',
          },
          {
            name: 'contact_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Nome de quem atendeu',
          },
          {
            name: 'contact_phone',
            type: 'varchar',
            length: '20',
            isNullable: true,
            comment: 'Telefone de contato',
          },
          {
            name: 'contact_relationship',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Relação com o destinatário',
          },
          {
            name: 'next_attempt_scheduled_at',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'Data/hora agendada para próxima tentativa',
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
      'delivery_attempts',
      new TableIndex({
        name: 'IDX_ATTEMPT_DELIVERY',
        columnNames: ['delivery_id'],
      }),
    );

    await queryRunner.createIndex(
      'delivery_attempts',
      new TableIndex({
        name: 'IDX_ATTEMPT_DRIVER',
        columnNames: ['driver_id'],
      }),
    );

    await queryRunner.createIndex(
      'delivery_attempts',
      new TableIndex({
        name: 'IDX_ATTEMPT_DATE',
        columnNames: ['attempt_date'],
      }),
    );

    await queryRunner.createIndex(
      'delivery_attempts',
      new TableIndex({
        name: 'IDX_ATTEMPT_RESULT',
        columnNames: ['result'],
      }),
    );

    // Índice composto para buscar tentativas de uma entrega ordenadas
    await queryRunner.createIndex(
      'delivery_attempts',
      new TableIndex({
        name: 'IDX_ATTEMPT_DELIVERY_NUMBER',
        columnNames: ['delivery_id', 'attempt_number'],
      }),
    );

    // Criar foreign keys
    await queryRunner.createForeignKey(
      'delivery_attempts',
      new TableForeignKey({
        name: 'FK_ATTEMPT_DELIVERY',
        columnNames: ['delivery_id'],
        referencedTableName: 'deliveries',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'delivery_attempts',
      new TableForeignKey({
        name: 'FK_ATTEMPT_DRIVER',
        columnNames: ['driver_id'],
        referencedTableName: 'drivers',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover foreign keys
    await queryRunner.dropForeignKey('delivery_attempts', 'FK_ATTEMPT_DRIVER');
    await queryRunner.dropForeignKey('delivery_attempts', 'FK_ATTEMPT_DELIVERY');

    // Remover índices
    await queryRunner.dropIndex('delivery_attempts', 'IDX_ATTEMPT_DELIVERY_NUMBER');
    await queryRunner.dropIndex('delivery_attempts', 'IDX_ATTEMPT_RESULT');
    await queryRunner.dropIndex('delivery_attempts', 'IDX_ATTEMPT_DATE');
    await queryRunner.dropIndex('delivery_attempts', 'IDX_ATTEMPT_DRIVER');
    await queryRunner.dropIndex('delivery_attempts', 'IDX_ATTEMPT_DELIVERY');

    // Remover tabela
    await queryRunner.dropTable('delivery_attempts');
  }
}
