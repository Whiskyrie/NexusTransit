import { Table, TableIndex, type MigrationInterface, type QueryRunner } from 'typeorm';

export class CreateAuditLogsTable1694544000101 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tipos ENUM
    await queryRunner.query(`
      CREATE TYPE "audit_action_enum" AS ENUM (
        'CREATE', 'UPDATE', 'DELETE', 'READ',
        'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE',
        'FAILED_LOGIN', 'ACCESS_DENIED'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "audit_category_enum" AS ENUM (
        'USER_MANAGEMENT', 'VEHICLE_MANAGEMENT', 'DRIVER_MANAGEMENT',
        'DELIVERY_MANAGEMENT', 'ROUTE_MANAGEMENT', 'CUSTOMER_MANAGEMENT',
        'INCIDENT_MANAGEMENT', 'SYSTEM', 'SECURITY', 'DATA_PRIVACY'
      )
    `);

    // Criar tabela audit_logs
    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
            comment: 'ID único do log de auditoria',
          },
          {
            name: 'action',
            type: 'audit_action_enum',
            isNullable: false,
            comment: 'Ação realizada',
          },
          {
            name: 'category',
            type: 'audit_category_enum',
            isNullable: false,
            comment: 'Categoria do log',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
            comment: 'ID do usuário que executou a ação',
          },
          {
            name: 'user_email',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Email do usuário',
          },
          {
            name: 'user_role',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Papel/função do usuário',
          },
          {
            name: 'resource_type',
            type: 'varchar',
            length: '100',
            isNullable: false,
            comment: 'Tipo de recurso afetado',
          },
          {
            name: 'resource_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'ID do recurso afetado',
          },
          {
            name: 'ip_address',
            type: 'inet',
            isNullable: true,
            comment: 'Endereço IP de origem',
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
            comment: 'User agent do navegador/cliente',
          },
          {
            name: 'request_method',
            type: 'varchar',
            length: '10',
            isNullable: true,
            comment: 'Método HTTP da requisição',
          },
          {
            name: 'request_url',
            type: 'text',
            isNullable: true,
            comment: 'URL da requisição',
          },
          {
            name: 'status_code',
            type: 'integer',
            isNullable: true,
            comment: 'Código de status HTTP da resposta',
          },
          {
            name: 'execution_time_ms',
            type: 'integer',
            isNullable: true,
            comment: 'Tempo de execução em milissegundos',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
            comment: 'Descrição da ação',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Metadados adicionais em formato JSON',
          },
          {
            name: 'old_values',
            type: 'jsonb',
            isNullable: true,
            comment: 'Valores antigos antes da modificação',
          },
          {
            name: 'new_values',
            type: 'jsonb',
            isNullable: true,
            comment: 'Novos valores após a modificação',
          },
          {
            name: 'session_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'ID da sessão do usuário',
          },
          {
            name: 'correlation_id',
            type: 'uuid',
            isNullable: true,
            comment: 'ID de correlação para rastreamento de requisições',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
            comment: 'Data e hora de criação do log',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
            comment: 'Data e hora da última atualização',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
            comment: 'Data e hora de exclusão lógica (soft delete)',
          },
          // LGPD compliance fields
          {
            name: 'data_subject_id',
            type: 'uuid',
            isNullable: true,
            comment: 'ID do titular dos dados (LGPD)',
          },
          {
            name: 'legal_basis',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Base legal para processamento dos dados (LGPD)',
          },
          {
            name: 'sensitive_data',
            type: 'boolean',
            default: false,
            isNullable: false,
            comment: 'Indica se contém dados sensíveis',
          },
          {
            name: 'retention_period_days',
            type: 'integer',
            isNullable: true,
            comment: 'Período de retenção em dias',
          },
        ],
      }),
      true,
    );

    // Criar índices para otimizar consultas
    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_AUDIT_LOGS_USER_CREATED',
        columnNames: ['user_id', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_AUDIT_LOGS_ACTION_CREATED',
        columnNames: ['action', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_AUDIT_LOGS_CATEGORY_CREATED',
        columnNames: ['category', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_AUDIT_LOGS_CREATED_AT',
        columnNames: ['created_at'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_AUDIT_LOGS_USER_ID',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_AUDIT_LOGS_RESOURCE',
        columnNames: ['resource_type', 'resource_id'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_AUDIT_LOGS_CORRELATION_ID',
        columnNames: ['correlation_id'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_AUDIT_LOGS_DATA_SUBJECT',
        columnNames: ['data_subject_id'],
      }),
    );

    // Criar índices GIN para campos JSONB (melhor performance em buscas JSON)
    await queryRunner.query(`
      CREATE INDEX "IDX_AUDIT_LOGS_METADATA_GIN" ON "audit_logs" USING GIN ("metadata")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_AUDIT_LOGS_OLD_VALUES_GIN" ON "audit_logs" USING GIN ("old_values")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_AUDIT_LOGS_NEW_VALUES_GIN" ON "audit_logs" USING GIN ("new_values")
    `);

    // Criar trigger para atualizar updated_at
    await queryRunner.query(`
      CREATE TRIGGER update_audit_logs_updated_at
      BEFORE UPDATE ON audit_logs
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);

    // Comentário na tabela
    await queryRunner.query(`
      COMMENT ON TABLE "audit_logs" IS 'Tabela de logs de auditoria do sistema - rastreia todas as ações importantes para conformidade e segurança'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover trigger
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_audit_logs_updated_at ON audit_logs`);

    // Remover índices GIN
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_AUDIT_LOGS_NEW_VALUES_GIN"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_AUDIT_LOGS_OLD_VALUES_GIN"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_AUDIT_LOGS_METADATA_GIN"`);

    // Remover índices regulares
    await queryRunner.dropIndex('audit_logs', 'IDX_AUDIT_LOGS_DATA_SUBJECT');
    await queryRunner.dropIndex('audit_logs', 'IDX_AUDIT_LOGS_CORRELATION_ID');
    await queryRunner.dropIndex('audit_logs', 'IDX_AUDIT_LOGS_RESOURCE');
    await queryRunner.dropIndex('audit_logs', 'IDX_AUDIT_LOGS_USER_ID');
    await queryRunner.dropIndex('audit_logs', 'IDX_AUDIT_LOGS_CREATED_AT');
    await queryRunner.dropIndex('audit_logs', 'IDX_AUDIT_LOGS_CATEGORY_CREATED');
    await queryRunner.dropIndex('audit_logs', 'IDX_AUDIT_LOGS_ACTION_CREATED');
    await queryRunner.dropIndex('audit_logs', 'IDX_AUDIT_LOGS_USER_CREATED');

    // Remover tabela
    await queryRunner.dropTable('audit_logs');

    // Remover tipos ENUM
    await queryRunner.query(`DROP TYPE IF EXISTS "audit_category_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "audit_action_enum"`);
  }
}
