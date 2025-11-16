import { type MigrationInterface, type QueryRunner, TableColumn } from 'typeorm';

export class AddDeletedAtToCustomerRelatedTables1694544000020 implements MigrationInterface {
  name = 'AddDeletedAtToCustomerRelatedTables1694544000020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add deleted_at to customer_addresses
    await queryRunner.addColumn(
      'customer_addresses',
      new TableColumn({
        name: 'deleted_at',
        type: 'timestamp with time zone',
        isNullable: true,
        default: null,
      }),
    );

    // Add deleted_at to customer_contacts
    await queryRunner.addColumn(
      'customer_contacts',
      new TableColumn({
        name: 'deleted_at',
        type: 'timestamp with time zone',
        isNullable: true,
        default: null,
      }),
    );

    // Add deleted_at to customer_preferences
    await queryRunner.addColumn(
      'customer_preferences',
      new TableColumn({
        name: 'deleted_at',
        type: 'timestamp with time zone',
        isNullable: true,
        default: null,
      }),
    );

    // Add comments
    await queryRunner.query(
      `COMMENT ON COLUMN customer_addresses.deleted_at IS 'Soft delete timestamp'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN customer_contacts.deleted_at IS 'Soft delete timestamp'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN customer_preferences.deleted_at IS 'Soft delete timestamp'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop deleted_at from customer_preferences
    await queryRunner.dropColumn('customer_preferences', 'deleted_at');

    // Drop deleted_at from customer_contacts
    await queryRunner.dropColumn('customer_contacts', 'deleted_at');

    // Drop deleted_at from customer_addresses
    await queryRunner.dropColumn('customer_addresses', 'deleted_at');
  }
}
