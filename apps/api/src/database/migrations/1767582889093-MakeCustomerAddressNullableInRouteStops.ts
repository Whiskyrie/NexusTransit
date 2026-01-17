import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class MakeCustomerAddressNullableInRouteStops1767582889093 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tornar customer_address_id nullable em route_stops
    await queryRunner.query(`
            ALTER TABLE route_stops 
            ALTER COLUMN customer_address_id DROP NOT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter customer_address_id para NOT NULL
    await queryRunner.query(`
            ALTER TABLE route_stops 
            ALTER COLUMN customer_address_id SET NOT NULL
        `);
  }
}
