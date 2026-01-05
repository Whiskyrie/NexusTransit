import { type MigrationInterface, type QueryRunner } from 'typeorm';

interface ColumnInfo {
  column_name: string;
}

export class AddMissingVehicleColumns1736027744000 implements MigrationInterface {
  name = 'AddMissingVehicleColumns1736027744000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enum para license_plate_type (verificar se já existe)
    const enumExists = (await queryRunner.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typname = 'license_plate_type_enum'
    `)) as { typname: string }[];

    if (enumExists.length === 0) {
      await queryRunner.query(`
        CREATE TYPE "license_plate_type_enum" AS ENUM (
          'old_format',
          'mercosul'
        )
      `);
    }

    // Renomear coluna 'type' para 'vehicle_type' apenas se ainda existir
    const typeColumnExists = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'type'
    `)) as ColumnInfo[];

    if (typeColumnExists.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "vehicles" RENAME COLUMN "type" TO "vehicle_type"
      `);
    }

    // Adicionar coluna license_plate_type se não existir
    const licensePlateTypeExists = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'license_plate_type'
    `)) as ColumnInfo[];

    if (licensePlateTypeExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "vehicles" 
        ADD COLUMN "license_plate_type" "license_plate_type_enum" DEFAULT 'mercosul' NOT NULL
      `);

      await queryRunner.query(`
        COMMENT ON COLUMN "vehicles"."license_plate_type" IS 'Tipo de formato da placa'
      `);
    }

    // Renomear colunas para consistência com a entidade (apenas se ainda existirem)
    const cargoCapacityKgExists = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'cargo_capacity_kg'
    `)) as ColumnInfo[];

    if (cargoCapacityKgExists.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "vehicles" RENAME COLUMN "cargo_capacity_kg" TO "load_capacity"
      `);
    }

    const cargoVolumeM3Exists = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'cargo_volume_m3'
    `)) as ColumnInfo[];

    if (cargoVolumeM3Exists.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "vehicles" RENAME COLUMN "cargo_volume_m3" TO "cargo_volume"
      `);
    }

    const fuelConsumptionKmlExists = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'fuel_consumption_kml'
    `)) as ColumnInfo[];

    if (fuelConsumptionKmlExists.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "vehicles" RENAME COLUMN "fuel_consumption_kml" TO "average_consumption"
      `);
    }

    const currentMileageExists = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'current_mileage'
    `)) as ColumnInfo[];

    if (currentMileageExists.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "vehicles" RENAME COLUMN "current_mileage" TO "mileage"
      `);
    }

    const lastMaintenanceDateExists = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'last_maintenance_date'
    `)) as ColumnInfo[];

    if (lastMaintenanceDateExists.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "vehicles" RENAME COLUMN "last_maintenance_date" TO "last_maintenance_at"
      `);
    }

    const nextMaintenanceMileageExists = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'next_maintenance_mileage'
    `)) as ColumnInfo[];

    if (nextMaintenanceMileageExists.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "vehicles" RENAME COLUMN "next_maintenance_mileage" TO "next_maintenance_km"
      `);
    }

    const documentationExpiryDateExists = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'documentation_expiry_date'
    `)) as ColumnInfo[];

    if (documentationExpiryDateExists.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "vehicles" RENAME COLUMN "documentation_expiry_date" TO "license_expiry_date"
      `);
    }

    // Alterar tipo de last_maintenance_at para timestamp with time zone se ainda for date
    const lastMaintenanceAtType = (await queryRunner.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'last_maintenance_at'
    `)) as { data_type: string }[];

    if (lastMaintenanceAtType.length > 0 && lastMaintenanceAtType[0].data_type === 'date') {
      await queryRunner.query(`
        ALTER TABLE "vehicles" 
        ALTER COLUMN "last_maintenance_at" TYPE timestamp with time zone
      `);
    }

    // Alterar tipo de license_expiry_date para timestamp with time zone se ainda for date
    const licenseExpiryDateType = (await queryRunner.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'license_expiry_date'
    `)) as { data_type: string }[];

    if (licenseExpiryDateType.length > 0 && licenseExpiryDateType[0].data_type === 'date') {
      await queryRunner.query(`
        ALTER TABLE "vehicles" 
        ALTER COLUMN "license_expiry_date" TYPE timestamp with time zone
      `);
    }

    // Adicionar novas colunas (apenas se não existirem)
    const fuelCapacityExists = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'fuel_capacity'
    `)) as ColumnInfo[];

    if (fuelCapacityExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "vehicles" 
        ADD COLUMN "fuel_capacity" decimal(10, 2) NULL
      `);

      await queryRunner.query(`
        COMMENT ON COLUMN "vehicles"."fuel_capacity" IS 'Capacidade do tanque em litros'
      `);
    }

    const nextMaintenanceAtExists = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'next_maintenance_at'
    `)) as ColumnInfo[];

    if (nextMaintenanceAtExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "vehicles" 
        ADD COLUMN "next_maintenance_at" timestamp with time zone NULL
      `);

      await queryRunner.query(`
        COMMENT ON COLUMN "vehicles"."next_maintenance_at" IS 'Data da próxima manutenção programada'
      `);
    }

    const acquisitionDateExists = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'acquisition_date'
    `)) as ColumnInfo[];

    if (acquisitionDateExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "vehicles" 
        ADD COLUMN "acquisition_date" timestamp with time zone NULL
      `);

      await queryRunner.query(`
        COMMENT ON COLUMN "vehicles"."acquisition_date" IS 'Data de aquisição do veículo'
      `);
    }

    const acquisitionValueExists = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'acquisition_value'
    `)) as ColumnInfo[];

    if (acquisitionValueExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "vehicles" 
        ADD COLUMN "acquisition_value" decimal(12, 2) NULL
      `);

      await queryRunner.query(`
        COMMENT ON COLUMN "vehicles"."acquisition_value" IS 'Valor de aquisição'
      `);
    }

    const insuranceCompanyExists = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'insurance_company'
    `)) as ColumnInfo[];

    if (insuranceCompanyExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "vehicles" 
        ADD COLUMN "insurance_company" varchar(100) NULL
      `);

      await queryRunner.query(`
        COMMENT ON COLUMN "vehicles"."insurance_company" IS 'Seguradora'
      `);
    }

    const insurancePolicyNumberExists = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'insurance_policy_number'
    `)) as ColumnInfo[];

    if (insurancePolicyNumberExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "vehicles" 
        ADD COLUMN "insurance_policy_number" varchar(50) NULL
      `);

      await queryRunner.query(`
        COMMENT ON COLUMN "vehicles"."insurance_policy_number" IS 'Número da apólice de seguro'
      `);
    }

    const insuranceExpiryDateExists = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'insurance_expiry_date'
    `)) as ColumnInfo[];

    if (insuranceExpiryDateExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "vehicles" 
        ADD COLUMN "insurance_expiry_date" timestamp with time zone NULL
      `);

      await queryRunner.query(`
        COMMENT ON COLUMN "vehicles"."insurance_expiry_date" IS 'Data de vencimento do seguro'
      `);
    }

    const insuranceInfoExists = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'insurance_info'
    `)) as ColumnInfo[];

    if (insuranceInfoExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "vehicles" 
        ADD COLUMN "insurance_info" jsonb NULL
      `);

      await queryRunner.query(`
        COMMENT ON COLUMN "vehicles"."insurance_info" IS 'Informações de seguro'
      `);
    }

    const specificationsExists = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'specifications'
    `)) as ColumnInfo[];

    if (specificationsExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "vehicles" 
        ADD COLUMN "specifications" jsonb NULL
      `);

      await queryRunner.query(`
        COMMENT ON COLUMN "vehicles"."specifications" IS 'Especificações técnicas adicionais'
      `);
    }

    const hasGpsExists = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'has_gps'
    `)) as ColumnInfo[];

    if (hasGpsExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "vehicles" 
        ADD COLUMN "has_gps" boolean DEFAULT false NOT NULL
      `);

      await queryRunner.query(`
        COMMENT ON COLUMN "vehicles"."has_gps" IS 'Possui rastreamento GPS'
      `);
    }

    const hasRefrigerationExists = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'has_refrigeration'
    `)) as ColumnInfo[];

    if (hasRefrigerationExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "vehicles" 
        ADD COLUMN "has_refrigeration" boolean DEFAULT false NOT NULL
      `);

      await queryRunner.query(`
        COMMENT ON COLUMN "vehicles"."has_refrigeration" IS 'Possui refrigeração'
      `);
    }

    const passengerCapacityExists = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'passenger_capacity'
    `)) as ColumnInfo[];

    if (passengerCapacityExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "vehicles" 
        ADD COLUMN "passenger_capacity" integer NULL
      `);

      await queryRunner.query(`
        COMMENT ON COLUMN "vehicles"."passenger_capacity" IS 'Capacidade de passageiros'
      `);
    }

    // Renomear coluna installed_devices para specifications se ainda existir
    const tableInfo = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'installed_devices'
    `)) as ColumnInfo[];

    if (tableInfo.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "vehicles" DROP COLUMN "installed_devices"
      `);
    }

    // Remover coluna settings duplicada
    const settingsInfo = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'settings'
    `)) as ColumnInfo[];

    if (settingsInfo.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "vehicles" DROP COLUMN "settings"
      `);
    }

    // Atualizar índice de tipo de veículo
    const vehicleTypeIndexExists = (await queryRunner.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'vehicles' AND indexname = 'idx_vehicles_vehicle_type'
    `)) as { indexname: string }[];

    if (vehicleTypeIndexExists.length === 0) {
      await queryRunner.query(`
        DROP INDEX IF EXISTS "idx_vehicles_type"
      `);

      await queryRunner.query(`
        CREATE INDEX "idx_vehicles_vehicle_type" ON "vehicles" ("vehicle_type")
      `);
    }

    // Criar índice para license_plate_type
    const licensePlateTypeIndexExists = (await queryRunner.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'vehicles' AND indexname = 'idx_vehicles_license_plate_type'
    `)) as { indexname: string }[];

    if (licensePlateTypeIndexExists.length === 0) {
      await queryRunner.query(`
        CREATE INDEX "idx_vehicles_license_plate_type" ON "vehicles" ("license_plate_type")
      `);
    }

    // Atualizar índice de manutenção (verificar se a coluna existe primeiro)
    const nextMaintenanceKmExists = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'next_maintenance_km'
    `)) as ColumnInfo[];

    if (nextMaintenanceKmExists.length > 0) {
      const nextMaintenanceKmIndexExists = (await queryRunner.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'vehicles' AND indexname = 'idx_vehicles_next_maintenance_km'
      `)) as { indexname: string }[];

      if (nextMaintenanceKmIndexExists.length === 0) {
        await queryRunner.query(`
          DROP INDEX IF EXISTS "idx_vehicles_maintenance"
        `);

        await queryRunner.query(`
          CREATE INDEX "idx_vehicles_next_maintenance_km" ON "vehicles" ("next_maintenance_km")
        `);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter índices
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_vehicles_next_maintenance_km"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_vehicles_license_plate_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_vehicles_vehicle_type"`);

    // Remover colunas adicionadas
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "passenger_capacity"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "has_refrigeration"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "has_gps"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "specifications"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "insurance_info"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "insurance_expiry_date"`);
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "insurance_policy_number"`,
    );
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "insurance_company"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "acquisition_value"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "acquisition_date"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "next_maintenance_at"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "fuel_capacity"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "license_plate_type"`);

    // Reverter renomeações (apenas se as colunas existirem)
    const licenseExpiryDateExists = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'license_expiry_date'
    `)) as ColumnInfo[];

    if (licenseExpiryDateExists.length > 0) {
      await queryRunner.query(
        `ALTER TABLE "vehicles" RENAME COLUMN "license_expiry_date" TO "documentation_expiry_date"`,
      );
    }

    const nextMaintenanceKmExists = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'next_maintenance_km'
    `)) as ColumnInfo[];

    if (nextMaintenanceKmExists.length > 0) {
      await queryRunner.query(
        `ALTER TABLE "vehicles" RENAME COLUMN "next_maintenance_km" TO "next_maintenance_mileage"`,
      );
    }

    const lastMaintenanceAtExists = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'last_maintenance_at'
    `)) as ColumnInfo[];

    if (lastMaintenanceAtExists.length > 0) {
      await queryRunner.query(
        `ALTER TABLE "vehicles" RENAME COLUMN "last_maintenance_at" TO "last_maintenance_date"`,
      );
    }

    const mileageExists = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'mileage'
    `)) as ColumnInfo[];

    if (mileageExists.length > 0) {
      await queryRunner.query(
        `ALTER TABLE "vehicles" RENAME COLUMN "mileage" TO "current_mileage"`,
      );
    }

    const averageConsumptionExists = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'average_consumption'
    `)) as ColumnInfo[];

    if (averageConsumptionExists.length > 0) {
      await queryRunner.query(
        `ALTER TABLE "vehicles" RENAME COLUMN "average_consumption" TO "fuel_consumption_kml"`,
      );
    }

    const cargoVolumeExists = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'cargo_volume'
    `)) as ColumnInfo[];

    if (cargoVolumeExists.length > 0) {
      await queryRunner.query(
        `ALTER TABLE "vehicles" RENAME COLUMN "cargo_volume" TO "cargo_volume_m3"`,
      );
    }

    const loadCapacityExists = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'load_capacity'
    `)) as ColumnInfo[];

    if (loadCapacityExists.length > 0) {
      await queryRunner.query(
        `ALTER TABLE "vehicles" RENAME COLUMN "load_capacity" TO "cargo_capacity_kg"`,
      );
    }

    const vehicleTypeExists = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'vehicle_type'
    `)) as ColumnInfo[];

    if (vehicleTypeExists.length > 0) {
      await queryRunner.query(`ALTER TABLE "vehicles" RENAME COLUMN "vehicle_type" TO "type"`);
    }

    // Alterar tipos de volta (apenas se as colunas existirem)
    const lastMaintenanceDateExists = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'last_maintenance_date'
    `)) as ColumnInfo[];

    if (lastMaintenanceDateExists.length > 0) {
      await queryRunner.query(
        `ALTER TABLE "vehicles" ALTER COLUMN "last_maintenance_date" TYPE date`,
      );
    }

    const documentationExpiryDateExists = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'documentation_expiry_date'
    `)) as ColumnInfo[];

    if (documentationExpiryDateExists.length > 0) {
      await queryRunner.query(
        `ALTER TABLE "vehicles" ALTER COLUMN "documentation_expiry_date" TYPE date`,
      );
    }

    // Remover enum
    await queryRunner.query(`DROP TYPE IF EXISTS "license_plate_type_enum"`);

    // Recriar índices originais
    await queryRunner.query(`CREATE INDEX "idx_vehicles_type" ON "vehicles" ("type")`);
    await queryRunner.query(
      `CREATE INDEX "idx_vehicles_maintenance" ON "vehicles" ("next_maintenance_mileage")`,
    );
  }
}
