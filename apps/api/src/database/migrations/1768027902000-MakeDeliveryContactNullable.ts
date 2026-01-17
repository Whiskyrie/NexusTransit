import type { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeDeliveryContactNullable1768027902000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tornar delivery_contact nullable para compatibilidade com a nova estrutura
    // que usa sender_contact e recipient_contact
    await queryRunner.query(`
      ALTER TABLE "deliveries" 
      ALTER COLUMN "delivery_contact" DROP NOT NULL
    `);

    // Copiar dados de delivery_contact para recipient_contact se recipient_contact estiver vazio
    await queryRunner.query(`
      UPDATE "deliveries" 
      SET "recipient_contact" = "delivery_contact"
      WHERE "recipient_contact" IS NULL AND "delivery_contact" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter: copiar recipient_contact de volta para delivery_contact
    await queryRunner.query(`
      UPDATE "deliveries" 
      SET "delivery_contact" = "recipient_contact"
      WHERE "delivery_contact" IS NULL AND "recipient_contact" IS NOT NULL
    `);

    // Tornar delivery_contact NOT NULL novamente
    await queryRunner.query(`
      ALTER TABLE "deliveries" 
      ALTER COLUMN "delivery_contact" SET NOT NULL
    `);
  }
}
