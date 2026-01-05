import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddRouteTotalDistance1736032000000 implements MigrationInterface {
  name = 'AddRouteTotalDistance1736032000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se a coluna total_distance já existe
    const totalDistanceExists = (await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'routes' AND column_name = 'total_distance'
    `)) as { column_name: string }[];

    if (totalDistanceExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "routes"
        ADD COLUMN "total_distance" decimal(10,2) NULL
      `);

      await queryRunner.query(`
        COMMENT ON COLUMN "routes"."total_distance" IS 'Distância total em km'
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "routes"
      DROP COLUMN IF EXISTS "total_distance"
    `);
  }
}
