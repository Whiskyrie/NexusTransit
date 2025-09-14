import { type MigrationInterface, type QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateDataRequestsTable1694544000008 implements MigrationInterface {
  name = 'CreateDataRequestsTable1694544000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enum para tipos de solicitação
    await queryRunner.query(`
      CREATE TYPE "data_request_type_enum" AS ENUM (
        'data_portability',
        'data_erasure',
        'data_access',
        'data_correction',
        'consent_revocation'
      )
    `);

    // Criar enum para status das solicitações
    await queryRunner.query(`
      CREATE TYPE "data_request_status_enum" AS ENUM (
        'pending',
        'processing',
        'completed',
        'failed',
        'cancelled',
        'expired'
      )
    `);

    // Criar tabela data_requests
    await queryRunner.createTable(
      new Table({
        name: 'data_requests',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'request_type',
            type: 'data_request_type_enum',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'data_request_status_enum',
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'request_ip',
            type: 'inet',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'due_date',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'processing_started_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'completed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'file_path',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'file_hash',
            type: 'varchar',
            length: '128',
            isNullable: true,
          },
          {
            name: 'file_size',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'processed_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'admin_notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['processed_by'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
      true,
    );

    // Criar índices
    await queryRunner.createIndex(
      'data_requests',
      new TableIndex({ name: 'IDX_DATA_REQUESTS_USER_ID', columnNames: ['user_id'] }),
    );

    await queryRunner.createIndex(
      'data_requests',
      new TableIndex({
        name: 'IDX_DATA_REQUESTS_USER_REQUEST_TYPE',
        columnNames: ['user_id', 'request_type'],
      }),
    );

    await queryRunner.createIndex(
      'data_requests',
      new TableIndex({ name: 'IDX_DATA_REQUESTS_USER_STATUS', columnNames: ['user_id', 'status'] }),
    );

    await queryRunner.createIndex(
      'data_requests',
      new TableIndex({
        name: 'IDX_DATA_REQUESTS_STATUS_CREATED',
        columnNames: ['status', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'data_requests',
      new TableIndex({ name: 'IDX_DATA_REQUESTS_DUE_DATE', columnNames: ['due_date'] }),
    );

    await queryRunner.createIndex(
      'data_requests',
      new TableIndex({ name: 'IDX_DATA_REQUESTS_PROCESSED_BY', columnNames: ['processed_by'] }),
    );

    // Adicionar trigger para updated_at
    await queryRunner.query(`
      CREATE TRIGGER update_data_requests_updated_at
        BEFORE UPDATE ON data_requests
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover trigger
    await queryRunner.query(
      'DROP TRIGGER IF EXISTS update_data_requests_updated_at ON data_requests',
    );

    // Remover índices
    await queryRunner.dropIndex('data_requests', 'IDX_DATA_REQUESTS_PROCESSED_BY');
    await queryRunner.dropIndex('data_requests', 'IDX_DATA_REQUESTS_DUE_DATE');
    await queryRunner.dropIndex('data_requests', 'IDX_DATA_REQUESTS_STATUS_CREATED');
    await queryRunner.dropIndex('data_requests', 'IDX_DATA_REQUESTS_USER_STATUS');
    await queryRunner.dropIndex('data_requests', 'IDX_DATA_REQUESTS_USER_REQUEST_TYPE');
    await queryRunner.dropIndex('data_requests', 'IDX_DATA_REQUESTS_USER_ID');

    // Remover tabela
    await queryRunner.dropTable('data_requests');

    // Remover enums
    await queryRunner.query('DROP TYPE "data_request_status_enum"');
    await queryRunner.query('DROP TYPE "data_request_type_enum"');
  }
}
