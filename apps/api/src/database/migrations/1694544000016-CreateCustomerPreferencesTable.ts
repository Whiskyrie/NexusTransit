import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateCustomerPreferencesTable1694544000016 implements MigrationInterface {
  name = 'CreateCustomerPreferencesTable1694544000016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Install UUID extension if not exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create customer_preferences table
    await queryRunner.createTable(
      new Table({
        name: 'customer_preferences',
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
            name: 'preferred_delivery_days',
            type: 'text',
            isArray: true,
            isNullable: true,
          },
          {
            name: 'preferred_delivery_time_start',
            type: 'time',
            isNullable: true,
          },
          {
            name: 'preferred_delivery_time_end',
            type: 'time',
            isNullable: true,
          },
          {
            name: 'delivery_instructions',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'notification_channels',
            type: 'text',
            isArray: true,
            isNullable: true,
          },
          {
            name: 'delivery_preferences',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'restrictions',
            type: 'jsonb',
            isNullable: true,
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
      'customer_preferences',
      new TableIndex({
        name: 'IDX_CUSTOMER_PREFERENCES_CUSTOMER_ID',
        columnNames: ['customer_id'],
      }),
    );

    await queryRunner.createIndex(
      'customer_preferences',
      new TableIndex({
        name: 'IDX_CUSTOMER_PREFERENCES_ACTIVE',
        columnNames: ['is_active'],
      }),
    );

    // Add unique constraint to ensure one preference per customer
    await queryRunner.createIndex(
      'customer_preferences',
      new TableIndex({
        name: 'UQ_CUSTOMER_PREFERENCES_CUSTOMER_ID',
        columnNames: ['customer_id'],
        isUnique: true,
      }),
    );

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      'customer_preferences',
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
      COMMENT ON TABLE customer_preferences IS 'Table for storing customer delivery and communication preferences';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN customer_preferences.preferred_delivery_days IS 'Preferred days for delivery (e.g., monday, tuesday, etc.)';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN customer_preferences.preferred_delivery_time_start IS 'Preferred start time for deliveries';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN customer_preferences.preferred_delivery_time_end IS 'Preferred end time for deliveries';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN customer_preferences.delivery_instructions IS 'Special instructions for delivery drivers';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN customer_preferences.notification_channels IS 'Preferred notification channels (email, sms, whatsapp, etc.)';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN customer_preferences.delivery_preferences IS 'JSON with delivery preferences (e.g., fragile items, signature required)';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN customer_preferences.restrictions IS 'JSON with delivery restrictions (e.g., no weekends, specific time windows)';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key first
    const table = await queryRunner.getTable('customer_preferences');
    const foreignKey = table?.foreignKeys.find(fk => fk.columnNames.includes('customer_id'));
    if (foreignKey) {
      await queryRunner.dropForeignKey('customer_preferences', foreignKey);
    }

    // Drop indexes
    await queryRunner.dropIndex('customer_preferences', 'UQ_CUSTOMER_PREFERENCES_CUSTOMER_ID');
    await queryRunner.dropIndex('customer_preferences', 'IDX_CUSTOMER_PREFERENCES_ACTIVE');
    await queryRunner.dropIndex('customer_preferences', 'IDX_CUSTOMER_PREFERENCES_CUSTOMER_ID');

    // Drop table
    await queryRunner.dropTable('customer_preferences');
  }
}
