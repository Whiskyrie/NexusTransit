import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddVehicleChassisAndRenavam1736028000000 implements MigrationInterface {
  name = 'AddVehicleChassisAndRenavam1736028000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar coluna chassis_number
    await queryRunner.query(`
      ALTER TABLE "vehicles"
      ADD COLUMN "chassis_number" varchar(50) NULL
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "vehicles"."chassis_number" IS 'Número do chassi'
    `);

    // Adicionar coluna renavam
    await queryRunner.query(`
      ALTER TABLE "vehicles"
      ADD COLUMN "renavam" varchar(50) NULL
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "vehicles"."renavam" IS 'Número do RENAVAM'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vehicles"
      DROP COLUMN IF EXISTS "renavam"
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles"
      DROP COLUMN IF EXISTS "chassis_number"
    `);
  }
}
