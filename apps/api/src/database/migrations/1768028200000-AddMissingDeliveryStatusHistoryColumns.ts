import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingDeliveryStatusHistoryColumns1768028200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar todas as colunas que estão faltando na tabela delivery_status_history

    // driver_data - dados do motorista
    await queryRunner.query(`
      ALTER TABLE "delivery_status_history" 
      ADD COLUMN IF NOT EXISTS "driver_data" jsonb
    `);

    // notifications - dados de notificações
    await queryRunner.query(`
      ALTER TABLE "delivery_status_history" 
      ADD COLUMN IF NOT EXISTS "notifications" jsonb
    `);

    // impact_data - dados de impacto
    await queryRunner.query(`
      ALTER TABLE "delivery_status_history" 
      ADD COLUMN IF NOT EXISTS "impact_data" jsonb
    `);

    // automatic_change - mudança automática
    await queryRunner.query(`
      ALTER TABLE "delivery_status_history" 
      ADD COLUMN IF NOT EXISTS "automatic_change" boolean DEFAULT false
    `);

    // reverted - mudança revertida
    await queryRunner.query(`
      ALTER TABLE "delivery_status_history" 
      ADD COLUMN IF NOT EXISTS "reverted" boolean DEFAULT false
    `);

    // reverted_by - ID do histórico que reverteu
    await queryRunner.query(`
      ALTER TABLE "delivery_status_history" 
      ADD COLUMN IF NOT EXISTS "reverted_by" uuid
    `);

    // internal_notes - observações internas
    await queryRunner.query(`
      ALTER TABLE "delivery_status_history" 
      ADD COLUMN IF NOT EXISTS "internal_notes" text
    `);

    // driver_id - FK para driver (se não existir)
    await queryRunner.query(`
      ALTER TABLE "delivery_status_history" 
      ADD COLUMN IF NOT EXISTS "driver_id" uuid
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter: remover colunas adicionadas

    await queryRunner.query(`
      ALTER TABLE "delivery_status_history" 
      DROP COLUMN IF EXISTS "driver_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "delivery_status_history" 
      DROP COLUMN IF EXISTS "internal_notes"
    `);

    await queryRunner.query(`
      ALTER TABLE "delivery_status_history" 
      DROP COLUMN IF EXISTS "reverted_by"
    `);

    await queryRunner.query(`
      ALTER TABLE "delivery_status_history" 
      DROP COLUMN IF EXISTS "reverted"
    `);

    await queryRunner.query(`
      ALTER TABLE "delivery_status_history" 
      DROP COLUMN IF EXISTS "automatic_change"
    `);

    await queryRunner.query(`
      ALTER TABLE "delivery_status_history" 
      DROP COLUMN IF EXISTS "impact_data"
    `);

    await queryRunner.query(`
      ALTER TABLE "delivery_status_history" 
      DROP COLUMN IF EXISTS "notifications"
    `);

    await queryRunner.query(`
      ALTER TABLE "delivery_status_history" 
      DROP COLUMN IF EXISTS "driver_data"
    `);
  }
}
