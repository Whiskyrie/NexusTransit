import { type MigrationInterface, type QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateUsersTable1694544000001 implements MigrationInterface {
  name = 'CreateUsersTable1694544000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Install UUID extension if not exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'password_hash',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'first_name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'last_name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'user_type',
            type: 'enum',
            enum: ['admin', 'driver', 'customer', 'operator', 'manager'],
            default: "'customer'",
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive', 'suspended'],
            default: "'active'",
            isNullable: false,
          },
          {
            name: 'last_login_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'preferences',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'email_verified',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'email_verified_at',
            type: 'timestamp with time zone',
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
            onUpdate: 'CURRENT_TIMESTAMP',
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
      'users',
      new TableIndex({
        name: 'IDX_users_email',
        columnNames: ['email'],
      }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_user_type',
        columnNames: ['user_type'],
      }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_created_at',
        columnNames: ['created_at'],
      }),
    );

    // Create composite index for common queries
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_type_status',
        columnNames: ['user_type', 'status'],
      }),
    );

    // Add comments
    await queryRunner.query(`
      COMMENT ON TABLE users IS 'Sistema de usuários do Nexus Transit';
      COMMENT ON COLUMN users.email IS 'Email único do usuário';
      COMMENT ON COLUMN users.password_hash IS 'Hash da senha do usuário';
      COMMENT ON COLUMN users.first_name IS 'Primeiro nome do usuário';
      COMMENT ON COLUMN users.last_name IS 'Sobrenome do usuário';
      COMMENT ON COLUMN users.phone IS 'Telefone do usuário';
      COMMENT ON COLUMN users.user_type IS 'Tipo de usuário no sistema';
      COMMENT ON COLUMN users.status IS 'Status atual do usuário';
      COMMENT ON COLUMN users.last_login_at IS 'Último login do usuário';
      COMMENT ON COLUMN users.preferences IS 'Configurações personalizadas do usuário';
      COMMENT ON COLUMN users.email_verified IS 'Email foi verificado';
      COMMENT ON COLUMN users.email_verified_at IS 'Data de verificação do email';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
