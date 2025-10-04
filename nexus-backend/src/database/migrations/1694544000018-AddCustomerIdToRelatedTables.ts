import { type MigrationInterface, type QueryRunner, TableIndex, TableColumn } from 'typeorm';

export class AddCustomerIdToRelatedTables1694544000018 implements MigrationInterface {
  name = 'AddCustomerIdToRelatedTables1694544000018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add customer_id to customer_contacts table
    const contactsTable = await queryRunner.getTable('customer_contacts');
    const hasContactsCustomerId = contactsTable?.columns.some(
      column => column.name === 'customer_id',
    );

    if (!hasContactsCustomerId) {
      await queryRunner.addColumn(
        'customer_contacts',
        new TableColumn({
          name: 'customer_id',
          type: 'uuid',
          isNullable: false,
        }),
      );

      // Create index for customer_contacts.customer_id
      await queryRunner.createIndex(
        'customer_contacts',
        new TableIndex({
          name: 'IDX_CUSTOMER_CONTACTS_CUSTOMER_ID',
          columnNames: ['customer_id'],
        }),
      );
    }

    // Add customer_id to customer_preferences table
    const preferencesTable = await queryRunner.getTable('customer_preferences');
    const hasPreferencesCustomerId = preferencesTable?.columns.some(
      column => column.name === 'customer_id',
    );

    if (!hasPreferencesCustomerId) {
      await queryRunner.addColumn(
        'customer_preferences',
        new TableColumn({
          name: 'customer_id',
          type: 'uuid',
          isNullable: false,
        }),
      );

      // Create index for customer_preferences.customer_id
      await queryRunner.createIndex(
        'customer_preferences',
        new TableIndex({
          name: 'IDX_CUSTOMER_PREFERENCES_CUSTOMER_ID',
          columnNames: ['customer_id'],
        }),
      );

      // Create unique index to ensure one preference per customer
      await queryRunner.createIndex(
        'customer_preferences',
        new TableIndex({
          name: 'UQ_CUSTOMER_PREFERENCES_CUSTOMER_ID',
          columnNames: ['customer_id'],
          isUnique: true,
        }),
      );
    }

    // Add comments
    await queryRunner.query(`
      COMMENT ON COLUMN customer_contacts.customer_id IS 'Direct reference to customer UUID for performance';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN customer_preferences.customer_id IS 'Direct reference to customer UUID for performance';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes from customer_preferences
    await queryRunner.dropIndex('customer_preferences', 'UQ_CUSTOMER_PREFERENCES_CUSTOMER_ID');
    await queryRunner.dropIndex('customer_preferences', 'IDX_CUSTOMER_PREFERENCES_CUSTOMER_ID');

    // Drop indexes from customer_contacts
    await queryRunner.dropIndex('customer_contacts', 'IDX_CUSTOMER_CONTACTS_CUSTOMER_ID');

    // Remove customer_id from customer_preferences
    await queryRunner.dropColumn('customer_preferences', 'customer_id');

    // Remove customer_id from customer_contacts
    await queryRunner.dropColumn('customer_contacts', 'customer_id');
  }
}
