import { type MigrationInterface, type QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateCustomersTable1694544000013 implements MigrationInterface {
  name = 'CreateCustomersTable1694544000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Install UUID extension if not exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create customers table
    await queryRunner.createTable(
      new Table({
        name: 'customers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tax_id',
            type: 'varchar',
            length: '18',
            isUnique: true,
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
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['individual', 'corporate'],
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive', 'blocked', 'prospect'],
            default: "'prospect'",
            isNullable: false,
          },
          {
            name: 'category',
            type: 'enum',
            enum: ['standard', 'premium', 'vip'],
            default: "'standard'",
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
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
          {
            name: 'deleted_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create indexes for performance
    await queryRunner.createIndex(
      'customers',
      new TableIndex({
        name: 'IDX_CUSTOMERS_TAX_ID',
        columnNames: ['tax_id'],
      }),
    );

    await queryRunner.createIndex(
      'customers',
      new TableIndex({
        name: 'IDX_CUSTOMERS_EMAIL',
        columnNames: ['email'],
      }),
    );

    await queryRunner.createIndex(
      'customers',
      new TableIndex({
        name: 'IDX_CUSTOMERS_STATUS',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'customers',
      new TableIndex({
        name: 'IDX_CUSTOMERS_TYPE',
        columnNames: ['type'],
      }),
    );

    await queryRunner.createIndex(
      'customers',
      new TableIndex({
        name: 'IDX_CUSTOMERS_CATEGORY',
        columnNames: ['category'],
      }),
    );

    // Create composite index for common queries
    await queryRunner.createIndex(
      'customers',
      new TableIndex({
        name: 'IDX_CUSTOMERS_STATUS_CATEGORY',
        columnNames: ['status', 'category'],
      }),
    );

    // Add comments for documentation
    await queryRunner.query(`
      COMMENT ON TABLE customers IS 'Table for storing customer information (individual and corporate)';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN customers.tax_id IS 'CPF or CNPJ (Brazilian tax identification)';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN customers.type IS 'Customer type: individual (PF) or corporate (PJ)';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN customers.status IS 'Customer status for business flow control';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN customers.category IS 'Customer category for segmentation and benefits';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN customers.metadata IS 'Additional customer data in JSON format';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.dropIndex('customers', 'IDX_CUSTOMERS_STATUS_CATEGORY');
    await queryRunner.dropIndex('customers', 'IDX_CUSTOMERS_CATEGORY');
    await queryRunner.dropIndex('customers', 'IDX_CUSTOMERS_TYPE');
    await queryRunner.dropIndex('customers', 'IDX_CUSTOMERS_STATUS');
    await queryRunner.dropIndex('customers', 'IDX_CUSTOMERS_EMAIL');
    await queryRunner.dropIndex('customers', 'IDX_CUSTOMERS_TAX_ID');

    // Drop table
    await queryRunner.dropTable('customers');
  }
}
