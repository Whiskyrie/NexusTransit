import { type MigrationInterface, type QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateQuotaUsageTable1731974400002 implements MigrationInterface {
  name = 'CreateQuotaUsageTable1731974400002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'quota_usage',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
            comment: 'Unique identifier for the usage record',
          },
          {
            name: 'client_id',
            type: 'varchar',
            length: '64',
            isNullable: false,
            comment: 'Unique client identifier (hash of IP + user agent)',
          },
          {
            name: 'ip',
            type: 'varchar',
            length: '45',
            isNullable: false,
            comment: 'Client IP address',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
            comment: 'User ID if authenticated',
          },
          {
            name: 'api_key_id',
            type: 'uuid',
            isNullable: true,
            comment: 'API Key ID if using API key authentication',
          },
          {
            name: 'endpoint',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'HTTP endpoint accessed',
          },
          {
            name: 'method',
            type: 'varchar',
            length: '10',
            isNullable: false,
            comment: 'HTTP method (GET, POST, etc.)',
          },
          {
            name: 'rule_id',
            type: 'uuid',
            isNullable: false,
            comment: 'Rate limit rule that was applied',
          },
          {
            name: 'requests_count',
            type: 'int',
            isNullable: false,
            comment: 'Number of requests made at the time',
          },
          {
            name: 'limit',
            type: 'int',
            isNullable: false,
            comment: 'Limit that was configured',
          },
          {
            name: 'blocked',
            type: 'boolean',
            default: false,
            isNullable: false,
            comment: 'Whether this request was blocked due to rate limiting',
          },
          {
            name: 'user_agent',
            type: 'varchar',
            length: '500',
            isNullable: true,
            comment: 'User agent string',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Additional metadata (headers, query params, etc.)',
          },
          {
            name: 'request_time',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
            comment: 'Timestamp of the request',
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
            comment: 'Timestamp when the record was created',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
            comment: 'Timestamp when the record was last updated',
          },
          {
            name: 'deleted_at',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'Timestamp when the record was soft deleted',
          },
        ],
      }),
      true, // Create if not exists
    );

    // Create indexes for performance and analytics
    await queryRunner.createIndex(
      'quota_usage',
      new TableIndex({
        name: 'IDX_QUOTA_USAGE_CLIENT_TIME',
        columnNames: ['client_id', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'quota_usage',
      new TableIndex({
        name: 'IDX_QUOTA_USAGE_IP_TIME',
        columnNames: ['ip', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'quota_usage',
      new TableIndex({
        name: 'IDX_QUOTA_USAGE_USER_TIME',
        columnNames: ['user_id', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'quota_usage',
      new TableIndex({
        name: 'IDX_QUOTA_USAGE_ENDPOINT_TIME',
        columnNames: ['endpoint', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'quota_usage',
      new TableIndex({
        name: 'IDX_QUOTA_USAGE_BLOCKED_TIME',
        columnNames: ['blocked', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'quota_usage',
      new TableIndex({
        name: 'IDX_QUOTA_USAGE_TIME',
        columnNames: ['created_at'],
      }),
    );

    await queryRunner.createIndex(
      'quota_usage',
      new TableIndex({
        name: 'IDX_QUOTA_USAGE_RULE',
        columnNames: ['rule_id'],
      }),
    );

    await queryRunner.createIndex(
      'quota_usage',
      new TableIndex({
        name: 'IDX_QUOTA_USAGE_REQUEST_TIME',
        columnNames: ['request_time'],
      }),
    );

    // Create a partial index for blocked requests (for faster abuse detection)
    await queryRunner.query(`
      CREATE INDEX IDX_QUOTA_USAGE_BLOCKED_TRUE_TIME 
      ON quota_usage (client_id, created_at) 
      WHERE blocked = true;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('quota_usage', 'IDX_QUOTA_USAGE_CLIENT_TIME');
    await queryRunner.dropIndex('quota_usage', 'IDX_QUOTA_USAGE_IP_TIME');
    await queryRunner.dropIndex('quota_usage', 'IDX_QUOTA_USAGE_USER_TIME');
    await queryRunner.dropIndex('quota_usage', 'IDX_QUOTA_USAGE_ENDPOINT_TIME');
    await queryRunner.dropIndex('quota_usage', 'IDX_QUOTA_USAGE_BLOCKED_TIME');
    await queryRunner.dropIndex('quota_usage', 'IDX_QUOTA_USAGE_TIME');
    await queryRunner.dropIndex('quota_usage', 'IDX_QUOTA_USAGE_RULE');
    await queryRunner.dropIndex('quota_usage', 'IDX_QUOTA_USAGE_REQUEST_TIME');
    await queryRunner.query('DROP INDEX IF EXISTS IDX_QUOTA_USAGE_BLOCKED_TRUE_TIME');

    // Drop table
    await queryRunner.dropTable('quota_usage');
  }
}
