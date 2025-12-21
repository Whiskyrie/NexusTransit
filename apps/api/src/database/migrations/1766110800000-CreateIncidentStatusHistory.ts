import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateIncidentStatusHistory1766110800000 implements MigrationInterface {
  name = 'CreateIncidentStatusHistory1766110800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela incident_status_history
    await queryRunner.createTable(
      new Table({
        name: 'incident_status_history',
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
            name: 'incident_id',
            type: 'uuid',
            comment: 'ID do incidente',
          },
          {
            name: 'old_status',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Status anterior do incidente',
          },
          {
            name: 'new_status',
            type: 'varchar',
            length: '50',
            comment: 'Novo status do incidente',
          },
          {
            name: 'changed_by_user_id',
            type: 'uuid',
            comment: 'ID do usuário que realizou a mudança de status',
          },
          {
            name: 'reason',
            type: 'text',
            isNullable: true,
            comment: 'Motivo ou observação sobre a mudança de status',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Dados adicionais da transição em formato JSON',
          },
          {
            name: 'time_in_previous_status',
            type: 'integer',
            isNullable: true,
            comment: 'Tempo decorrido no status anterior em segundos',
          },
        ],
      }),
      true,
    );

    // Criar índices
    await queryRunner.createIndex(
      'incident_status_history',
      new TableIndex({
        name: 'IDX_incident_status_history_incident_created',
        columnNames: ['incident_id', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'incident_status_history',
      new TableIndex({
        name: 'IDX_incident_status_history_incident_new_status',
        columnNames: ['incident_id', 'new_status'],
      }),
    );

    // Criar foreign keys
    await queryRunner.createForeignKey(
      'incident_status_history',
      new TableForeignKey({
        name: 'FK_incident_status_history_incident',
        columnNames: ['incident_id'],
        referencedTableName: 'incidents',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'incident_status_history',
      new TableForeignKey({
        name: 'FK_incident_status_history_user',
        columnNames: ['changed_by_user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover foreign keys
    await queryRunner.dropForeignKey('incident_status_history', 'FK_incident_status_history_user');

    await queryRunner.dropForeignKey(
      'incident_status_history',
      'FK_incident_status_history_incident',
    );

    // Remover índices
    await queryRunner.dropIndex(
      'incident_status_history',
      'IDX_incident_status_history_incident_new_status',
    );

    await queryRunner.dropIndex(
      'incident_status_history',
      'IDX_incident_status_history_incident_created',
    );

    // Remover tabela
    await queryRunner.dropTable('incident_status_history');
  }
}
