import { type MigrationInterface, type QueryRunner, TableColumn } from 'typeorm';

export class AddMetadataToCustomerRelatedTables1694544000021 implements MigrationInterface {
  name = 'AddMetadataToCustomerRelatedTables1694544000021';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add metadata to customer_addresses
    await queryRunner.addColumn(
      'customer_addresses',
      new TableColumn({
        name: 'metadata',
        type: 'jsonb',
        isNullable: true,
        default: null,
      }),
    );

    // Add metadata to customer_contacts
    await queryRunner.addColumn(
      'customer_contacts',
      new TableColumn({
        name: 'metadata',
        type: 'jsonb',
        isNullable: true,
        default: null,
      }),
    );

    // Add metadata to customer_preferences
    await queryRunner.addColumn(
      'customer_preferences',
      new TableColumn({
        name: 'metadata',
        type: 'jsonb',
        isNullable: true,
        default: null,
      }),
    );

    // Add comments
    await queryRunner.query(
      `COMMENT ON COLUMN customer_addresses.metadata IS 'Additional metadata for the address'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN customer_contacts.metadata IS 'Additional metadata for the contact'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN customer_preferences.metadata IS 'Additional metadata for the preferences'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop metadata from customer_preferences
    await queryRunner.dropColumn('customer_preferences', 'metadata');

    // Drop metadata from customer_contacts
    await queryRunner.dropColumn('customer_contacts', 'metadata');

    // Drop metadata from customer_addresses
    await queryRunner.dropColumn('customer_addresses', 'metadata');
  }
}
