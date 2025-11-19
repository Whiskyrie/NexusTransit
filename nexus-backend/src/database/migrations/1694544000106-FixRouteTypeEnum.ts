import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class FixRouteTypeEnum1694544000106 implements MigrationInterface {
  name = 'FixRouteTypeEnum1694544000106';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Criar novo enum com valores corretos em MAIÚSCULO
    await queryRunner.query(`
      CREATE TYPE "route_type_enum_new" AS ENUM (
        'URBAN',
        'INTERSTATE',
        'RURAL',
        'EXPRESS',
        'LOCAL'
      )
    `);

    // 2. Adicionar coluna temporária com novo enum
    await queryRunner.query(`
      ALTER TABLE "routes" 
      ADD COLUMN "type_new" "route_type_enum_new"
    `);

    // 3. Migrar dados antigos para novo formato (conversão para maiúsculo)
    await queryRunner.query(`
      UPDATE "routes" 
      SET "type_new" = CASE 
        WHEN "type" = 'urban' THEN 'URBAN'::"route_type_enum_new"
        WHEN "type" = 'interstate' THEN 'INTERSTATE'::"route_type_enum_new"
        WHEN "type" = 'rural' THEN 'RURAL'::"route_type_enum_new"
        WHEN "type" = 'express' THEN 'EXPRESS'::"route_type_enum_new"
        WHEN "type" = 'local' THEN 'LOCAL'::"route_type_enum_new"
        ELSE 'LOCAL'::"route_type_enum_new"
      END
    `);

    // 4. Remover coluna antiga
    await queryRunner.query(`
      ALTER TABLE "routes" 
      DROP COLUMN "type"
    `);

    // 5. Renomear coluna nova para o nome original
    await queryRunner.query(`
      ALTER TABLE "routes" 
      RENAME COLUMN "type_new" TO "type"
    `);

    // 6. Definir valor padrão e NOT NULL
    await queryRunner.query(`
      ALTER TABLE "routes" 
      ALTER COLUMN "type" SET DEFAULT 'LOCAL'::"route_type_enum_new"
    `);

    await queryRunner.query(`
      ALTER TABLE "routes" 
      ALTER COLUMN "type" SET NOT NULL
    `);

    // 7. Remover enum antigo
    await queryRunner.query(`
      DROP TYPE "route_type_enum"
    `);

    // 8. Renomear novo enum para o nome original
    await queryRunner.query(`
      ALTER TYPE "route_type_enum_new" RENAME TO "route_type_enum"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Criar enum antigo com valores minúsculos
    await queryRunner.query(`
      CREATE TYPE "route_type_enum_old" AS ENUM (
        'urban',
        'interstate',
        'rural',
        'express',
        'local'
      )
    `);

    // 2. Adicionar coluna temporária com enum antigo
    await queryRunner.query(`
      ALTER TABLE "routes" 
      ADD COLUMN "type_old" "route_type_enum_old"
    `);

    // 3. Reverter mapeamento de dados (conversão para minúsculo)
    await queryRunner.query(`
      UPDATE "routes" 
      SET "type_old" = CASE 
        WHEN "type" = 'URBAN' THEN 'urban'::"route_type_enum_old"
        WHEN "type" = 'INTERSTATE' THEN 'interstate'::"route_type_enum_old"
        WHEN "type" = 'RURAL' THEN 'rural'::"route_type_enum_old"
        WHEN "type" = 'EXPRESS' THEN 'express'::"route_type_enum_old"
        WHEN "type" = 'LOCAL' THEN 'local'::"route_type_enum_old"
        ELSE 'local'::"route_type_enum_old"
      END
    `);

    // 4. Remover coluna nova
    await queryRunner.query(`
      ALTER TABLE "routes" 
      DROP COLUMN "type"
    `);

    // 5. Renomear coluna antiga para o nome original
    await queryRunner.query(`
      ALTER TABLE "routes" 
      RENAME COLUMN "type_old" TO "type"
    `);

    // 6. Definir valor padrão
    await queryRunner.query(`
      ALTER TABLE "routes" 
      ALTER COLUMN "type" SET DEFAULT 'local'::"route_type_enum_old"
    `);

    // 7. Remover enum novo
    await queryRunner.query(`
      DROP TYPE "route_type_enum"
    `);

    // 8. Renomear enum antigo para o nome original
    await queryRunner.query(`
      ALTER TYPE "route_type_enum_old" RENAME TO "route_type_enum"
    `);
  }
}
