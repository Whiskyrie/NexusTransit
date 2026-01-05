import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddVehicleNotes1736031000000 implements MigrationInterface {
  name = 'AddVehicleNotes1736031000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se a coluna notes já existe
    const notesExists = (await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'vehicles' AND column_name = 'notes'
    `)) as { column_name: string }[];

    if (notesExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "vehicles"
        ADD COLUMN "notes" text NULL
      `);

      await queryRunner.query(`
        COMMENT ON COLUMN "vehicles"."notes" IS 'Observações gerais'
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vehicles"
      DROP COLUMN IF EXISTS "notes"
    `);
  }
}
