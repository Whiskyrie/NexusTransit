import { type MigrationInterface, type QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateRateLimitRulesTable1731974400001 implements MigrationInterface {
  name = 'CreateRateLimitRulesTable1731974400001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'rate_limit_rules',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
            comment: 'Unique identifier for the rule',
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'Type of rate limiting: IP, USER, API_KEY, ENDPOINT, GLOBAL',
          },
          {
            name: 'strategy',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'Strategy to use: SLIDING_WINDOW, TOKEN_BUCKET, FIXED_WINDOW',
          },
          {
            name: 'limit',
            type: 'int',
            isNullable: false,
            comment: 'Maximum number of requests allowed within the time window',
          },
          {
            name: 'window_size',
            type: 'int',
            isNullable: false,
            comment: 'Time window in milliseconds',
          },
          {
            name: 'priority',
            type: 'int',
            default: 100,
            isNullable: false,
            comment: 'Rule priority (lower number = higher priority)',
          },
          {
            name: 'refill_rate',
            type: 'float',
            isNullable: true,
            comment: 'Token refill rate (tokens per second) for TOKEN_BUCKET strategy',
          },
          {
            name: 'role_id',
            type: 'uuid',
            isNullable: true,
            comment: 'Role ID for role-based rate limiting',
          },
          {
            name: 'endpoint',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Specific endpoint pattern for endpoint-based limiting',
          },
          {
            name: 'api_key_id',
            type: 'uuid',
            isNullable: true,
            comment: 'API Key ID for API key-based rate limiting',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
            comment: 'Whether this rule is currently active',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
            comment: 'Optional description of the rule purpose',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Additional configuration parameters',
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
            comment: 'Timestamp when the rule was created',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
            comment: 'Timestamp when the rule was last updated',
          },
          {
            name: 'deleted_at',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'Timestamp when the rule was soft deleted',
          },
        ],
      }),
      true, // Create if not exists
    );

    // Create indexes for performance
    await queryRunner.createIndex(
      'rate_limit_rules',
      new TableIndex({
        name: 'IDX_RATE_LIMIT_RULES_TYPE_ACTIVE',
        columnNames: ['type', 'is_active'],
      }),
    );

    await queryRunner.createIndex(
      'rate_limit_rules',
      new TableIndex({
        name: 'IDX_RATE_LIMIT_RULES_ROLE_ACTIVE',
        columnNames: ['role_id', 'is_active'],
      }),
    );

    await queryRunner.createIndex(
      'rate_limit_rules',
      new TableIndex({
        name: 'IDX_RATE_LIMIT_RULES_ENDPOINT_ACTIVE',
        columnNames: ['endpoint', 'is_active'],
      }),
    );

    await queryRunner.createIndex(
      'rate_limit_rules',
      new TableIndex({
        name: 'IDX_RATE_LIMIT_RULES_PRIORITY',
        columnNames: ['priority'],
      }),
    );

    await queryRunner.createIndex(
      'rate_limit_rules',
      new TableIndex({
        name: 'IDX_RATE_LIMIT_RULES_DELETED_AT',
        columnNames: ['deleted_at'],
      }),
    );

    // Insert default rate limit rules
    await queryRunner.query(`
      INSERT INTO rate_limit_rules (type, strategy, "limit", window_size, priority, is_active, description)
      VALUES
        ('GLOBAL', 'SLIDING_WINDOW', 1000, 60000, 100, true, 'Global rate limit for all endpoints'),
        ('IP', 'FIXED_WINDOW', 100, 60000, 90, true, 'IP-based rate limit for unauthenticated users'),
        ('USER', 'TOKEN_BUCKET', 500, 60000, 80, true, 'Default rate limit for authenticated users');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('rate_limit_rules', 'IDX_RATE_LIMIT_RULES_TYPE_ACTIVE');
    await queryRunner.dropIndex('rate_limit_rules', 'IDX_RATE_LIMIT_RULES_ROLE_ACTIVE');
    await queryRunner.dropIndex('rate_limit_rules', 'IDX_RATE_LIMIT_RULES_ENDPOINT_ACTIVE');
    await queryRunner.dropIndex('rate_limit_rules', 'IDX_RATE_LIMIT_RULES_PRIORITY');
    await queryRunner.dropIndex('rate_limit_rules', 'IDX_RATE_LIMIT_RULES_DELETED_AT');

    // Drop table
    await queryRunner.dropTable('rate_limit_rules');
  }
}
