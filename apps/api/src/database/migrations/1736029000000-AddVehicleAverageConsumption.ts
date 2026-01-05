import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddVehicleAverageConsumption1736029000000 implements MigrationInterface {
  name = 'AddVehicleAverageConsumption1736029000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se a coluna fuel_consumption_kml existe e renomear para average_consumption
    const fuelConsumptionKmlExists = (await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'vehicles' AND column_name = 'fuel_consumption_kml'
    `)) as { column_name: string }[];

    if (fuelConsumptionKmlExists.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "vehicles" RENAME COLUMN "fuel_consumption_kml" TO "average_consumption"
      `);
    } else {
      // Se não existe, criar a coluna average_consumption
      const averageConsumptionExists = (await queryRunner.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'vehicles' AND column_name = 'average_consumption'
      `)) as { column_name: string }[];

      if (averageConsumptionExists.length === 0) {
        await queryRunner.query(`
          ALTER TABLE "vehicles"
          ADD COLUMN "average_consumption" decimal(10,2) NULL
        `);

        await queryRunner.query(`
          COMMENT ON COLUMN "vehicles"."average_consumption" IS 'Consumo médio em km/l'
        `);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vehicles"
      DROP COLUMN IF EXISTS "average_consumption"
    `);
  }
}
