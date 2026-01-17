import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddNextMaintenanceKmColumn1736027744001 implements MigrationInterface {
  name = 'AddNextMaintenanceKmColumn1736027744001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se a coluna já existe
    const columnExists = await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'vehicles' AND column_name = 'next_maintenance_km'
    `);

    if (columnExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "vehicles"
        ADD COLUMN "next_maintenance_km" integer NULL
      `);

      await queryRunner.query(`
        COMMENT ON COLUMN "vehicles"."next_maintenance_km" IS 'Próxima manutenção em km'
      `);
    }

    // Criar índice se não existir
    const indexExists = await queryRunner.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'vehicles' AND indexname = 'idx_vehicles_next_maintenance_km'
    `);

    if (indexExists.length === 0) {
      await queryRunner.query(`
        CREATE INDEX "idx_vehicles_next_maintenance_km" ON "vehicles" ("next_maintenance_km")
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_vehicles_next_maintenance_km"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "next_maintenance_km"`);
  }
}
