import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddRouteDeliveryId1736035000000 implements MigrationInterface {
  name = 'AddRouteDeliveryId1736035000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se a coluna delivery_id já existe
    const deliveryIdExists = (await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'routes' AND column_name = 'delivery_id'
    `)) as { column_name: string }[];

    if (deliveryIdExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "routes"
        ADD COLUMN "delivery_id" uuid NULL
      `);

      await queryRunner.query(`
        COMMENT ON COLUMN "routes"."delivery_id" IS 'ID da entrega associada'
      `);

      // Adicionar chave estrangeira para a tabela deliveries
      await queryRunner.query(`
        ALTER TABLE "routes"
        ADD CONSTRAINT "fk_routes_delivery_id"
        FOREIGN KEY ("delivery_id")
        REFERENCES "deliveries"("id")
        ON DELETE SET NULL
        ON UPDATE CASCADE
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover a chave estrangeira primeiro
    await queryRunner.query(`
      ALTER TABLE "routes"
      DROP CONSTRAINT IF EXISTS "fk_routes_delivery_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "routes"
      DROP COLUMN IF EXISTS "delivery_id"
    `);
  }
}
