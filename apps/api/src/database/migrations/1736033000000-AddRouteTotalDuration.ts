import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddRouteTotalDuration1736033000000 implements MigrationInterface {
  name = 'AddRouteTotalDuration1736033000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se a coluna total_duration já existe
    const totalDurationExists = (await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'routes' AND column_name = 'total_duration'
    `)) as { column_name: string }[];

    if (totalDurationExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "routes"
        ADD COLUMN "total_duration" integer NULL
      `);

      await queryRunner.query(`
        COMMENT ON COLUMN "routes"."total_duration" IS 'Duração total em minutos'
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "routes"
      DROP COLUMN IF EXISTS "total_duration"
    `);
  }
}
