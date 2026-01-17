import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameDeliveryStatusHistoryColumns1768028100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Renomear colunas para compatibilidade com a entidade

    // previous_status -> from_status
    await queryRunner.query(`
      ALTER TABLE "delivery_status_history" 
      RENAME COLUMN "previous_status" TO "from_status"
    `);

    // new_status -> to_status
    await queryRunner.query(`
      ALTER TABLE "delivery_status_history" 
      RENAME COLUMN "new_status" TO "to_status"
    `);

    // Adicionar colunas que estão faltando na tabela
    await queryRunner.query(`
      ALTER TABLE "delivery_status_history" 
      ADD COLUMN IF NOT EXISTS "changed_by_name" varchar(100)
    `);

    await queryRunner.query(`
      ALTER TABLE "delivery_status_history" 
      ADD COLUMN IF NOT EXISTS "changed_by_type" varchar(50)
    `);

    // Adicionar coluna location
    await queryRunner.query(`
      ALTER TABLE "delivery_status_history" 
      ADD COLUMN IF NOT EXISTS "location" jsonb
    `);

    // Atualizar índices se necessário
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_STATUS_HISTORY_NEW_STATUS"
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_STATUS_HISTORY_TO_STATUS" 
      ON "delivery_status_history" ("to_status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_STATUS_HISTORY_FROM_STATUS" 
      ON "delivery_status_history" ("from_status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter mudanças

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_STATUS_HISTORY_FROM_STATUS"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_STATUS_HISTORY_TO_STATUS"
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_STATUS_HISTORY_NEW_STATUS" 
      ON "delivery_status_history" ("to_status")
    `);

    await queryRunner.query(`
      ALTER TABLE "delivery_status_history" 
      DROP COLUMN IF EXISTS "changed_by_type"
    `);

    await queryRunner.query(`
      ALTER TABLE "delivery_status_history" 
      DROP COLUMN IF EXISTS "changed_by_name"
    `);

    await queryRunner.query(`
      ALTER TABLE "delivery_status_history" 
      RENAME COLUMN "to_status" TO "new_status"
    `);

    await queryRunner.query(`
      ALTER TABLE "delivery_status_history" 
      RENAME COLUMN "from_status" TO "previous_status"
    `);
  }
}
