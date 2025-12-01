import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Migration: CreateUsersTable
 * 
 * FIDELIDADE TOTAL AO MONÓLITO:
 * - Estrutura idêntica da tabela users
 * - Mesmos tipos de dados
 * - Mesmos índices
 * - Mesmas constraints
 * 
 * Baseado em: nexus-backend/src/database/migrations/1694544000001-CreateUsersTable.ts
 */
export class CreateUsersTable1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tipo ENUM para user_type
    await queryRunner.query(`
      CREATE TYPE user_type_enum AS ENUM (
        'admin',
        'driver',
        'customer',
        'operator',
        'manager'
      );
    `);

    // Criar tipo ENUM para user_status
    await queryRunner.query(`
      CREATE TYPE user_status_enum AS ENUM (
        'active',
        'inactive',
        'suspended'
      );
    `);

    // Criar tabela users
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
            type: 'user_type_enum',
            default: "'customer'",
            isNullable: false,
          },
          {
            name: 'status',
            type: 'user_status_enum',
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

    // Criar índices
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
        name: 'IDX_users_deleted_at',
        columnNames: ['deleted_at'],
      }),
    );

    // Habilitar extensão uuid-ossp se não estiver habilitada
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.dropIndex('users', 'IDX_users_email');
    await queryRunner.dropIndex('users', 'IDX_users_user_type');
    await queryRunner.dropIndex('users', 'IDX_users_status');
    await queryRunner.dropIndex('users', 'IDX_users_deleted_at');

    // Remover tabela
    await queryRunner.dropTable('users');

    // Remover tipos ENUM
    await queryRunner.query(`DROP TYPE IF EXISTS user_type_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_status_enum;`);
  }
}
