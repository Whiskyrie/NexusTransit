import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingDeliveryColumns1767770957963 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar colunas que estão faltando na tabela deliveries

    // Descrição da entrega
    await queryRunner.query(`
            ALTER TABLE "deliveries" 
            ADD COLUMN IF NOT EXISTS "description" text
        `);

    // Peso
    await queryRunner.query(`
            ALTER TABLE "deliveries" 
            ADD COLUMN IF NOT EXISTS "weight" decimal(8,2)
        `);

    // Valor declarado
    await queryRunner.query(`
            ALTER TABLE "deliveries" 
            ADD COLUMN IF NOT EXISTS "declared_value" decimal(10,2)
        `);

    // Dimensões
    await queryRunner.query(`
            ALTER TABLE "deliveries" 
            ADD COLUMN IF NOT EXISTS "dimensions" jsonb
        `);

    // Contato do remetente (renomear pickup_contact se existir)
    await queryRunner.query(`
            ALTER TABLE "deliveries" 
            ADD COLUMN IF NOT EXISTS "sender_contact" jsonb
        `);

    // Contato do destinatário (renomear delivery_contact se existir)
    await queryRunner.query(`
            ALTER TABLE "deliveries" 
            ADD COLUMN IF NOT EXISTS "recipient_contact" jsonb
        `);

    // Distância estimada
    await queryRunner.query(`
            ALTER TABLE "deliveries" 
            ADD COLUMN IF NOT EXISTS "estimated_distance" decimal(10,2)
        `);

    // Duração estimada
    await queryRunner.query(`
            ALTER TABLE "deliveries" 
            ADD COLUMN IF NOT EXISTS "estimated_duration" integer
        `);

    // Informações de pagamento
    await queryRunner.query(`
            ALTER TABLE "deliveries" 
            ADD COLUMN IF NOT EXISTS "payment_info" jsonb
        `);

    // Instruções de coleta
    await queryRunner.query(`
            ALTER TABLE "deliveries" 
            ADD COLUMN IF NOT EXISTS "pickup_instructions" text
        `);

    // Instruções de entrega
    await queryRunner.query(`
            ALTER TABLE "deliveries" 
            ADD COLUMN IF NOT EXISTS "delivery_instructions" text
        `);

    // Notas
    await queryRunner.query(`
            ALTER TABLE "deliveries" 
            ADD COLUMN IF NOT EXISTS "notes" text
        `);

    // Configurações
    await queryRunner.query(`
            ALTER TABLE "deliveries" 
            ADD COLUMN IF NOT EXISTS "settings" jsonb
        `);

    // Detalhes dos itens
    await queryRunner.query(`
            ALTER TABLE "deliveries" 
            ADD COLUMN IF NOT EXISTS "item_details" jsonb
        `);

    // Copiar dados existentes se houver
    await queryRunner.query(`
            UPDATE "deliveries" 
            SET "sender_contact" = "pickup_contact"
            WHERE "sender_contact" IS NULL AND "pickup_contact" IS NOT NULL
        `);

    await queryRunner.query(`
            UPDATE "deliveries" 
            SET "recipient_contact" = "delivery_contact"
            WHERE "recipient_contact" IS NULL AND "delivery_contact" IS NOT NULL
        `);

    await queryRunner.query(`
            UPDATE "deliveries" 
            SET "estimated_distance" = "estimated_distance_km"
            WHERE "estimated_distance" IS NULL AND "estimated_distance_km" IS NOT NULL
        `);

    await queryRunner.query(`
            UPDATE "deliveries" 
            SET "estimated_duration" = "estimated_duration_minutes"
            WHERE "estimated_duration" IS NULL AND "estimated_duration_minutes" IS NOT NULL
        `);

    await queryRunner.query(`
            UPDATE "deliveries" 
            SET "pickup_instructions" = "special_instructions"
            WHERE "pickup_instructions" IS NULL AND "special_instructions" IS NOT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "deliveries" DROP COLUMN IF EXISTS "description"`);
    await queryRunner.query(`ALTER TABLE "deliveries" DROP COLUMN IF EXISTS "weight"`);
    await queryRunner.query(`ALTER TABLE "deliveries" DROP COLUMN IF EXISTS "declared_value"`);
    await queryRunner.query(`ALTER TABLE "deliveries" DROP COLUMN IF EXISTS "dimensions"`);
    await queryRunner.query(`ALTER TABLE "deliveries" DROP COLUMN IF EXISTS "sender_contact"`);
    await queryRunner.query(`ALTER TABLE "deliveries" DROP COLUMN IF EXISTS "recipient_contact"`);
    await queryRunner.query(`ALTER TABLE "deliveries" DROP COLUMN IF EXISTS "estimated_distance"`);
    await queryRunner.query(`ALTER TABLE "deliveries" DROP COLUMN IF EXISTS "estimated_duration"`);
    await queryRunner.query(`ALTER TABLE "deliveries" DROP COLUMN IF EXISTS "payment_info"`);
    await queryRunner.query(`ALTER TABLE "deliveries" DROP COLUMN IF EXISTS "pickup_instructions"`);
    await queryRunner.query(
      `ALTER TABLE "deliveries" DROP COLUMN IF EXISTS "delivery_instructions"`,
    );
    await queryRunner.query(`ALTER TABLE "deliveries" DROP COLUMN IF EXISTS "notes"`);
    await queryRunner.query(`ALTER TABLE "deliveries" DROP COLUMN IF EXISTS "settings"`);
    await queryRunner.query(`ALTER TABLE "deliveries" DROP COLUMN IF EXISTS "item_details"`);
  }
}
