import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddInRouteToVehicleStatusEnum1694544000101 implements MigrationInterface {
  name = 'AddInRouteToVehicleStatusEnum1694544000101';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar o valor 'in_route' ao enum vehicles_status_enum (usado pela tabela vehicles)
    await queryRunner.query(`
      ALTER TYPE "vehicles_status_enum" ADD VALUE IF NOT EXISTS 'in_route'
    `);

    // Também adicionar ao vehicle_status_enum (se existir) para manter consistência
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_status_enum') THEN
          ALTER TYPE "vehicle_status_enum" ADD VALUE IF NOT EXISTS 'in_route';
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Nota: PostgreSQL não permite remover valores de enum diretamente
    // Se necessário fazer rollback, será preciso recriar o enum
    await queryRunner.query(`
      -- Criar enum temporário sem 'in_route'
      CREATE TYPE "vehicles_status_enum_old" AS ENUM (
        'active',
        'inactive', 
        'maintenance',
        'out_of_service'
      );
      
      -- Alterar coluna para usar o enum antigo
      ALTER TABLE "vehicles" 
        ALTER COLUMN "status" TYPE "vehicles_status_enum_old" 
        USING "status"::text::"vehicles_status_enum_old";
      
      -- Remover enum novo
      DROP TYPE "vehicles_status_enum";
      
      -- Renomear enum antigo
      ALTER TYPE "vehicles_status_enum_old" RENAME TO "vehicles_status_enum";
    `);
  }
}
