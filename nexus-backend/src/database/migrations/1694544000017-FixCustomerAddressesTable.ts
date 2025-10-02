import { type MigrationInterface, type QueryRunner, TableIndex, TableColumn } from 'typeorm';

export class FixCustomerAddressesTable1694544000017 implements MigrationInterface {
  name = 'FixCustomerAddressesTable1694544000017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add customer_id column if it doesn't exist
    const table = await queryRunner.getTable('customer_addresses');
    const hasCustomerIdColumn = table?.columns.some(column => column.name === 'customer_id');

    if (!hasCustomerIdColumn) {
      await queryRunner.addColumn(
        'customer_addresses',
        new TableColumn({
          name: 'customer_id',
          type: 'uuid',
          isNullable: false,
        }),
      );
    }

    // Rename is_default to is_primary if it exists
    const hasIsDefaultColumn = table?.columns.some(column => column.name === 'is_default');

    if (hasIsDefaultColumn) {
      await queryRunner.renameColumn('customer_addresses', 'is_default', 'is_primary');
    } else {
      // Add is_primary column if it doesn't exist
      const hasIsPrimaryColumn = table?.columns.some(column => column.name === 'is_primary');

      if (!hasIsPrimaryColumn) {
        await queryRunner.addColumn(
          'customer_addresses',
          new TableColumn({
            name: 'is_primary',
            type: 'boolean',
            default: false,
            isNullable: false,
          }),
        );
      }
    }

    // Create index for customer_id if it doesn't exist
    const hasCustomerIdIndex = table?.indexes.some(index =>
      index.columnNames.includes('customer_id'),
    );

    if (!hasCustomerIdIndex) {
      await queryRunner.createIndex(
        'customer_addresses',
        new TableIndex({
          name: 'IDX_CUSTOMER_ADDRESSES_CUSTOMER_ID',
          columnNames: ['customer_id'],
        }),
      );
    }

    // Create composite index for primary addresses
    const hasPrimaryIndex = table?.indexes.some(
      index =>
        index.name === 'IDX_CUSTOMER_ADDRESSES_PRIMARY' &&
        index.columnNames.includes('customer_id') &&
        index.columnNames.includes('is_primary'),
    );

    if (!hasPrimaryIndex) {
      await queryRunner.createIndex(
        'customer_addresses',
        new TableIndex({
          name: 'IDX_CUSTOMER_ADDRESSES_PRIMARY',
          columnNames: ['customer_id', 'is_primary'],
        }),
      );
    }

    // Update existing data to populate customer_id from customer relationship
    // This assumes there's a foreign key relationship already established
    await queryRunner.query(`
      UPDATE customer_addresses 
      SET customer_id = (
        SELECT c.id 
        FROM customers c 
        WHERE c.id = customer_addresses.customer_id
        LIMIT 1
      )
      WHERE customer_id IS NULL
    `);

    // Add comments
    await queryRunner.query(`
      COMMENT ON COLUMN customer_addresses.customer_id IS 'Direct reference to customer UUID for performance';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN customer_addresses.is_primary IS 'Primary address for customer deliveries and billing';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('customer_addresses', 'IDX_CUSTOMER_ADDRESSES_PRIMARY');
    await queryRunner.dropIndex('customer_addresses', 'IDX_CUSTOMER_ADDRESSES_CUSTOMER_ID');

    // Rename is_primary back to is_default
    await queryRunner.renameColumn('customer_addresses', 'is_primary', 'is_default');

    // Remove customer_id column
    await queryRunner.dropColumn('customer_addresses', 'customer_id');
  }
}
