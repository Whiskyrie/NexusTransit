import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddRouteDeliveryColumns1736034000000 implements MigrationInterface {
  name = 'AddRouteDeliveryColumns1736034000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar coluna total_deliveries
    const totalDeliveriesExists = (await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'routes' AND column_name = 'total_deliveries'
    `)) as { column_name: string }[];

    if (totalDeliveriesExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "routes"
        ADD COLUMN "total_deliveries" integer NULL
      `);

      await queryRunner.query(`
        COMMENT ON COLUMN "routes"."total_deliveries" IS 'Número total de entregas'
      `);
    }

    // Adicionar coluna completed_deliveries
    const completedDeliveriesExists = (await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'routes' AND column_name = 'completed_deliveries'
    `)) as { column_name: string }[];

    if (completedDeliveriesExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "routes"
        ADD COLUMN "completed_deliveries" integer NULL
      `);

      await queryRunner.query(`
        COMMENT ON COLUMN "routes"."completed_deliveries" IS 'Número de entregas concluídas'
      `);
    }

    // Adicionar coluna failed_deliveries
    const failedDeliveriesExists = (await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'routes' AND column_name = 'failed_deliveries'
    `)) as { column_name: string }[];

    if (failedDeliveriesExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "routes"
        ADD COLUMN "failed_deliveries" integer NULL
      `);

      await queryRunner.query(`
        COMMENT ON COLUMN "routes"."failed_deliveries" IS 'Número de entregas falhadas'
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "routes"
      DROP COLUMN IF EXISTS "failed_deliveries"
    `);

    await queryRunner.query(`
      ALTER TABLE "routes"
      DROP COLUMN IF EXISTS "completed_deliveries"
    `);

    await queryRunner.query(`
      ALTER TABLE "routes"
      DROP COLUMN IF EXISTS "total_deliveries"
    `);
  }
}
