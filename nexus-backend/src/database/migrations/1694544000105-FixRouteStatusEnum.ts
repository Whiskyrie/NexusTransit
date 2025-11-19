import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class FixRouteStatusEnum1694544000105 implements MigrationInterface {
  name = 'FixRouteStatusEnum1694544000105';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Criar novo enum com valores corretos em MAIÚSCULO
    await queryRunner.query(`
      CREATE TYPE "route_status_enum_new" AS ENUM (
        'PLANNED',
        'IN_PROGRESS',
        'PAUSED',
        'COMPLETED',
        'CANCELLED'
      )
    `);

    // 2. Adicionar coluna temporária com novo enum
    await queryRunner.query(`
      ALTER TABLE "routes" 
      ADD COLUMN "status_new" "route_status_enum_new"
    `);

    // 3. Migrar dados antigos para novo formato (mapeamento de valores)
    await queryRunner.query(`
      UPDATE "routes" 
      SET "status_new" = CASE 
        WHEN "status" = 'active' THEN 'PLANNED'::"route_status_enum_new"
        WHEN "status" = 'inactive' THEN 'CANCELLED'::"route_status_enum_new"
        WHEN "status" = 'under_maintenance' THEN 'PAUSED'::"route_status_enum_new"
        WHEN "status" = 'blocked' THEN 'CANCELLED'::"route_status_enum_new"
        ELSE 'PLANNED'::"route_status_enum_new"
      END
    `);

    // 4. Remover coluna antiga
    await queryRunner.query(`
      ALTER TABLE "routes" 
      DROP COLUMN "status"
    `);

    // 5. Renomear coluna nova para o nome original
    await queryRunner.query(`
      ALTER TABLE "routes" 
      RENAME COLUMN "status_new" TO "status"
    `);

    // 6. Definir valor padrão e NOT NULL
    await queryRunner.query(`
      ALTER TABLE "routes" 
      ALTER COLUMN "status" SET DEFAULT 'PLANNED'::"route_status_enum_new"
    `);

    await queryRunner.query(`
      ALTER TABLE "routes" 
      ALTER COLUMN "status" SET NOT NULL
    `);

    // 7. Remover enum antigo
    await queryRunner.query(`
      DROP TYPE "route_status_enum"
    `);

    // 8. Renomear novo enum para o nome original
    await queryRunner.query(`
      ALTER TYPE "route_status_enum_new" RENAME TO "route_status_enum"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Criar enum antigo com valores minúsculos
    await queryRunner.query(`
      CREATE TYPE "route_status_enum_old" AS ENUM (
        'active',
        'inactive',
        'under_maintenance',
        'blocked'
      )
    `);

    // 2. Adicionar coluna temporária com enum antigo
    await queryRunner.query(`
      ALTER TABLE "routes" 
      ADD COLUMN "status_old" "route_status_enum_old"
    `);

    // 3. Reverter mapeamento de dados
    await queryRunner.query(`
      UPDATE "routes" 
      SET "status_old" = CASE 
        WHEN "status" = 'PLANNED' THEN 'active'::"route_status_enum_old"
        WHEN "status" = 'IN_PROGRESS' THEN 'active'::"route_status_enum_old"
        WHEN "status" = 'PAUSED' THEN 'under_maintenance'::"route_status_enum_old"
        WHEN "status" = 'COMPLETED' THEN 'inactive'::"route_status_enum_old"
        WHEN "status" = 'CANCELLED' THEN 'blocked'::"route_status_enum_old"
        ELSE 'active'::"route_status_enum_old"
      END
    `);

    // 4. Remover coluna nova
    await queryRunner.query(`
      ALTER TABLE "routes" 
      DROP COLUMN "status"
    `);

    // 5. Renomear coluna antiga para o nome original
    await queryRunner.query(`
      ALTER TABLE "routes" 
      RENAME COLUMN "status_old" TO "status"
    `);

    // 6. Definir valor padrão
    await queryRunner.query(`
      ALTER TABLE "routes" 
      ALTER COLUMN "status" SET DEFAULT 'active'::"route_status_enum_old"
    `);

    // 7. Remover enum novo
    await queryRunner.query(`
      DROP TYPE "route_status_enum"
    `);

    // 8. Renomear enum antigo para o nome original
    await queryRunner.query(`
      ALTER TYPE "route_status_enum_old" RENAME TO "route_status_enum"
    `);
  }
}
