import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddRouteStopDeliveryId1736036000000 implements MigrationInterface {
  name = 'AddRouteStopDeliveryId1736036000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se a coluna delivery_id já existe
    const deliveryIdExists = (await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'route_stops' AND column_name = 'delivery_id'
    `)) as { column_name: string }[];

    if (deliveryIdExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "route_stops"
        ADD COLUMN "delivery_id" uuid NULL
      `);

      await queryRunner.query(`
        COMMENT ON COLUMN "route_stops"."delivery_id" IS 'ID da entrega associada a esta parada'
      `);

      // Adicionar chave estrangeira para a tabela deliveries
      await queryRunner.query(`
        ALTER TABLE "route_stops"
        ADD CONSTRAINT "fk_route_stops_delivery_id"
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
      ALTER TABLE "route_stops"
      DROP CONSTRAINT IF EXISTS "fk_route_stops_delivery_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "route_stops"
      DROP COLUMN IF EXISTS "delivery_id"
    `);
  }
}
