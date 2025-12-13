import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateCustomerContactsTable1694544000015 implements MigrationInterface {
  name = 'CreateCustomerContactsTable1694544000015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Install UUID extension if not exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create customer_contacts table
    await queryRunner.createTable(
      new Table({
        name: 'customer_contacts',
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
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['primary', 'financial', 'delivery', 'emergency', 'other'],
            default: "'other'",
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
            name: 'notes',
            type: 'text',
            isNullable: true,
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
      'customer_contacts',
      new TableIndex({
        name: 'IDX_CUSTOMER_CONTACTS_CUSTOMER_ID',
        columnNames: ['customer_id'],
      }),
    );

    await queryRunner.createIndex(
      'customer_contacts',
      new TableIndex({
        name: 'IDX_CUSTOMER_CONTACTS_EMAIL',
        columnNames: ['email'],
      }),
    );

    await queryRunner.createIndex(
      'customer_contacts',
      new TableIndex({
        name: 'IDX_CUSTOMER_CONTACTS_PHONE',
        columnNames: ['phone'],
      }),
    );

    await queryRunner.createIndex(
      'customer_contacts',
      new TableIndex({
        name: 'IDX_CUSTOMER_CONTACTS_TYPE',
        columnNames: ['type'],
      }),
    );

    await queryRunner.createIndex(
      'customer_contacts',
      new TableIndex({
        name: 'IDX_CUSTOMER_CONTACTS_PRIMARY',
        columnNames: ['customer_id', 'is_primary'],
      }),
    );

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      'customer_contacts',
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
      COMMENT ON TABLE customer_contacts IS 'Table for storing customer contact information';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN customer_contacts.type IS 'Contact type: primary, financial, delivery, emergency, or other';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN customer_contacts.is_primary IS 'Primary contact for the customer';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN customer_contacts.notes IS 'Additional notes about the contact';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key first
    const table = await queryRunner.getTable('customer_contacts');
    const foreignKey = table?.foreignKeys.find(fk => fk.columnNames.includes('customer_id'));
    if (foreignKey) {
      await queryRunner.dropForeignKey('customer_contacts', foreignKey);
    }

    // Drop indexes
    await queryRunner.dropIndex('customer_contacts', 'IDX_CUSTOMER_CONTACTS_PRIMARY');
    await queryRunner.dropIndex('customer_contacts', 'IDX_CUSTOMER_CONTACTS_TYPE');
    await queryRunner.dropIndex('customer_contacts', 'IDX_CUSTOMER_CONTACTS_PHONE');
    await queryRunner.dropIndex('customer_contacts', 'IDX_CUSTOMER_CONTACTS_EMAIL');
    await queryRunner.dropIndex('customer_contacts', 'IDX_CUSTOMER_CONTACTS_CUSTOMER_ID');

    // Drop table
    await queryRunner.dropTable('customer_contacts');
  }
}
