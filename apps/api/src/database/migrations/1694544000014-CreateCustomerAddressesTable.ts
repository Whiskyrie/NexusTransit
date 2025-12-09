import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateCustomerAddressesTable1694544000014 implements MigrationInterface {
  name = 'CreateCustomerAddressesTable1694544000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Install UUID extension if not exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create customer_addresses table
    await queryRunner.createTable(
      new Table({
        name: 'customer_addresses',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'customer_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'street',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'number',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'complement',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'neighborhood',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'zip_code',
            type: 'varchar',
            length: '8',
            isNullable: false,
          },
          {
            name: 'city',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'state',
            type: 'varchar',
            length: '2',
            isNullable: false,
          },
          {
            name: 'latitude',
            type: 'decimal',
            precision: 10,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'longitude',
            type: 'decimal',
            precision: 11,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['residential', 'commercial', 'billing', 'delivery'],
            default: "'residential'",
            isNullable: false,
          },
          {
            name: 'is_primary',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes for performance
    await queryRunner.createIndex(
      'customer_addresses',
      new TableIndex({
        name: 'IDX_CUSTOMER_ADDRESSES_CUSTOMER_ID',
        columnNames: ['customer_id'],
      }),
    );

    await queryRunner.createIndex(
      'customer_addresses',
      new TableIndex({
        name: 'IDX_CUSTOMER_ADDRESSES_ZIP_CODE',
        columnNames: ['zip_code'],
      }),
    );

    await queryRunner.createIndex(
      'customer_addresses',
      new TableIndex({
        name: 'IDX_CUSTOMER_ADDRESSES_CITY_STATE',
        columnNames: ['city', 'state'],
      }),
    );

    await queryRunner.createIndex(
      'customer_addresses',
      new TableIndex({
        name: 'IDX_CUSTOMER_ADDRESSES_PRIMARY',
        columnNames: ['customer_id', 'is_primary'],
      }),
    );

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      'customer_addresses',
      new TableForeignKey({
        columnNames: ['customer_id'],
        referencedTableName: 'customers',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    // Add comments for documentation
    await queryRunner.query(`
      COMMENT ON TABLE customer_addresses IS 'Table for storing customer delivery and billing addresses';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN customer_addresses.zip_code IS 'Brazilian CEP (postal code)';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN customer_addresses.type IS 'Address type: residential, commercial, billing, or delivery';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN customer_addresses.is_primary IS 'Primary address for deliveries and billing';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN customer_addresses.latitude IS 'Latitude for geolocation and routing';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN customer_addresses.longitude IS 'Longitude for geolocation and routing';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop spatial index if it exists
    try {
      await queryRunner.query(`DROP INDEX IF EXISTS IDX_CUSTOMER_ADDRESSES_LOCATION`);
    } catch {
      // Index might not exist, continue
    }

    // Drop foreign key first
    const table = await queryRunner.getTable('customer_addresses');
    const foreignKey = table?.foreignKeys.find(fk => fk.columnNames.includes('customer_id'));
    if (foreignKey) {
      await queryRunner.dropForeignKey('customer_addresses', foreignKey);
    }

    // Drop indexes
    await queryRunner.dropIndex('customer_addresses', 'IDX_CUSTOMER_ADDRESSES_PRIMARY');
    await queryRunner.dropIndex('customer_addresses', 'IDX_CUSTOMER_ADDRESSES_CITY_STATE');
    await queryRunner.dropIndex('customer_addresses', 'IDX_CUSTOMER_ADDRESSES_ZIP_CODE');
    await queryRunner.dropIndex('customer_addresses', 'IDX_CUSTOMER_ADDRESSES_CUSTOMER_ID');

    // Drop table
    await queryRunner.dropTable('customer_addresses');
  }
}
