import type { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeDeliveryColumnsNullable1768028000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tornar várias colunas nullable para compatibilidade com a entidade atual

    // product_info - opcional na entidade
    await queryRunner.query(`
      ALTER TABLE "deliveries" 
      ALTER COLUMN "product_info" DROP NOT NULL
    `);

    // pickup_contact - já é nullable, mas garantir
    await queryRunner.query(`
      ALTER TABLE "deliveries" 
      ALTER COLUMN "pickup_contact" DROP NOT NULL
    `);

    // special_instructions - opcional na entidade
    await queryRunner.query(`
      ALTER TABLE "deliveries" 
      ALTER COLUMN "special_instructions" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter: tornar as colunas NOT NULL novamente
    // Nota: Isso pode falhar se houver valores nulos

    await queryRunner.query(`
      UPDATE "deliveries" 
      SET "product_info" = '{}'::jsonb
      WHERE "product_info" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "deliveries" 
      ALTER COLUMN "product_info" SET NOT NULL
    `);

    await queryRunner.query(`
      UPDATE "deliveries" 
      SET "special_instructions" = ''
      WHERE "special_instructions" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "deliveries" 
      ALTER COLUMN "special_instructions" SET NOT NULL
    `);
  }
}
