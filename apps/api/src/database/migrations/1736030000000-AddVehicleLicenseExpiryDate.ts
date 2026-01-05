import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddVehicleLicenseExpiryDate1736030000000 implements MigrationInterface {
  name = 'AddVehicleLicenseExpiryDate1736030000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se a coluna documentation_expiry_date existe e renomear para license_expiry_date
    const documentationExpiryDateExists = (await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'vehicles' AND column_name = 'documentation_expiry_date'
    `)) as { column_name: string }[];

    if (documentationExpiryDateExists.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "vehicles" RENAME COLUMN "documentation_expiry_date" TO "license_expiry_date"
      `);
    } else {
      // Se não existe, criar a coluna license_expiry_date
      const licenseExpiryDateExists = (await queryRunner.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'vehicles' AND column_name = 'license_expiry_date'
      `)) as { column_name: string }[];

      if (licenseExpiryDateExists.length === 0) {
        await queryRunner.query(`
          ALTER TABLE "vehicles"
          ADD COLUMN "license_expiry_date" timestamp with time zone NULL
        `);

        await queryRunner.query(`
          COMMENT ON COLUMN "vehicles"."license_expiry_date" IS 'Data de vencimento do licenciamento'
        `);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vehicles"
      DROP COLUMN IF EXISTS "license_expiry_date"
    `);
  }
}
