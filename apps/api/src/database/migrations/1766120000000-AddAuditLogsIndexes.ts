import { type MigrationInterface, type QueryRunner, TableIndex } from 'typeorm';

export class AddAuditLogsIndexes1766120000000 implements MigrationInterface {
  name = 'AddAuditLogsIndexes1766120000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Índice composto para consultas por usuário e data
    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_user_created',
        columnNames: ['user_id', 'created_at'],
        where: 'user_id IS NOT NULL',
      }),
    );

    // Índice composto para consultas por ação e data
    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_action_created',
        columnNames: ['action', 'created_at'],
      }),
    );

    // Índice composto para consultas por categoria e data
    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_category_created',
        columnNames: ['category', 'created_at'],
      }),
    );

    // Índice composto para consultas por recurso (tipo + id)
    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_resource',
        columnNames: ['resource_type', 'resource_id'],
        where: 'resource_id IS NOT NULL',
      }),
    );

    // Índice GIN para busca em JSONB (metadata)
    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_metadata_gin" 
      ON "audit_logs" USING gin(metadata)
      WHERE metadata IS NOT NULL;
    `);

    // Índice GIN para busca em JSONB (old_values)
    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_old_values_gin" 
      ON "audit_logs" USING gin(old_values)
      WHERE old_values IS NOT NULL;
    `);

    // Índice GIN para busca em JSONB (new_values)
    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_new_values_gin" 
      ON "audit_logs" USING gin(new_values)
      WHERE new_values IS NOT NULL;
    `);

    // Índice para consultas de IP
    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_ip_address',
        columnNames: ['ip_address'],
        where: 'ip_address IS NOT NULL',
      }),
    );

    // Índice para busca textual em descrição
    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_description_trgm" 
      ON "audit_logs" USING gin(description gin_trgm_ops)
      WHERE description IS NOT NULL;
    `);

    // Criar extensão para trigram se ainda não existir
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

    // Comentário sobre particionamento futuro
    await queryRunner.query(`
      COMMENT ON TABLE "audit_logs" IS 
      'Tabela de logs de auditoria. Considerar particionamento por mês para melhor performance em volumes altos.';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices GIN customizados
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_logs_description_trgm";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_logs_new_values_gin";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_logs_old_values_gin";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_logs_metadata_gin";`);

    // Remover índices compostos
    await queryRunner.dropIndex('audit_logs', 'IDX_audit_logs_ip_address');
    await queryRunner.dropIndex('audit_logs', 'IDX_audit_logs_resource');
    await queryRunner.dropIndex('audit_logs', 'IDX_audit_logs_category_created');
    await queryRunner.dropIndex('audit_logs', 'IDX_audit_logs_action_created');
    await queryRunner.dropIndex('audit_logs', 'IDX_audit_logs_user_created');

    // Remover comentário
    await queryRunner.query(`COMMENT ON TABLE "audit_logs" IS NULL;`);
  }
}
