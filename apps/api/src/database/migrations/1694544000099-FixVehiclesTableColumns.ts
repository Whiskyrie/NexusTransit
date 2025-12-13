import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class FixVehiclesTableColumns1694544000099 implements MigrationInterface {
  name = 'FixVehiclesTableColumns1694544000099';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Renomear colunas para match com a entidade
    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      RENAME COLUMN "type" TO "vehicle_type"
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      RENAME COLUMN "cargo_capacity_kg" TO "load_capacity"
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      RENAME COLUMN "cargo_volume_m3" TO "cargo_volume"
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      RENAME COLUMN "current_mileage" TO "mileage"
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      RENAME COLUMN "last_maintenance_date" TO "last_maintenance_at"
    `);

    // Alterar tipo da coluna last_maintenance_at de date para timestamp with time zone
    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      ALTER COLUMN "last_maintenance_at" TYPE timestamp with time zone
    `);

    // Remover coluna next_maintenance_mileage (era integer) e criar next_maintenance_at (timestamp)
    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      DROP COLUMN IF EXISTS "next_maintenance_mileage"
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      ADD COLUMN "next_maintenance_at" timestamp with time zone NULL
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "vehicles"."next_maintenance_at" IS 'Data da próxima manutenção programada'
    `);

    // Remover colunas não utilizadas na entidade
    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      DROP COLUMN IF EXISTS "fuel_consumption_kml"
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      DROP COLUMN IF EXISTS "documentation_expiry_date"
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      DROP COLUMN IF EXISTS "chassis_number"
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      DROP COLUMN IF EXISTS "renavam"
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      DROP COLUMN IF EXISTS "installed_devices"
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      DROP COLUMN IF EXISTS "settings"
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      DROP COLUMN IF EXISTS "notes"
    `);

    // Adicionar novas colunas que estão na entidade
    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      ADD COLUMN "fuel_capacity" decimal(10,2) NULL
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "vehicles"."fuel_capacity" IS 'Capacidade do tanque em litros'
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      ADD COLUMN "insurance_info" jsonb NULL
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "vehicles"."insurance_info" IS 'Informações de seguro'
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      ADD COLUMN "specifications" jsonb NULL
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "vehicles"."specifications" IS 'Especificações técnicas adicionais'
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      ADD COLUMN "has_gps" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "vehicles"."has_gps" IS 'Possui rastreamento GPS'
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      ADD COLUMN "has_refrigeration" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "vehicles"."has_refrigeration" IS 'Possui refrigeração'
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      ADD COLUMN "passenger_capacity" integer NULL
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "vehicles"."passenger_capacity" IS 'Capacidade de passageiros'
    `);

    // Atualizar índice do tipo de veículo
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_vehicles_type"
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_vehicles_vehicle_type" ON "vehicles" ("vehicle_type")
    `);

    // Atualizar índice de manutenção
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_vehicles_maintenance"
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_vehicles_next_maintenance" ON "vehicles" ("next_maintenance_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter índices
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_vehicles_next_maintenance"
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_vehicles_maintenance" ON "vehicles" ("next_maintenance_mileage")
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_vehicles_vehicle_type"
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_vehicles_type" ON "vehicles" ("type")
    `);

    // Remover colunas adicionadas
    await queryRunner.query(`
      ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "passenger_capacity"
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "has_refrigeration"
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "has_gps"
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "specifications"
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "insurance_info"
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "fuel_capacity"
    `);

    // Restaurar colunas antigas
    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      ADD COLUMN "notes" text NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      ADD COLUMN "settings" jsonb NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      ADD COLUMN "installed_devices" jsonb NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      ADD COLUMN "renavam" varchar(50) NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      ADD COLUMN "chassis_number" varchar(100) NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      ADD COLUMN "documentation_expiry_date" date NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      ADD COLUMN "fuel_consumption_kml" decimal(10,2) NULL
    `);

    // Reverter alterações de tipo
    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      DROP COLUMN IF EXISTS "next_maintenance_at"
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      ADD COLUMN "next_maintenance_mileage" integer NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      ALTER COLUMN "last_maintenance_at" TYPE date
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      RENAME COLUMN "last_maintenance_at" TO "last_maintenance_date"
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      RENAME COLUMN "mileage" TO "current_mileage"
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      RENAME COLUMN "cargo_volume" TO "cargo_volume_m3"
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      RENAME COLUMN "load_capacity" TO "cargo_capacity_kg"
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" 
      RENAME COLUMN "vehicle_type" TO "type"
    `);
  }
}
