import { type MigrationInterface, type QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateDriversTable1694544000009 implements MigrationInterface {
  name = 'CreateDriversTable1694544000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enum para status de motorista
    await queryRunner.query(`
      CREATE TYPE "driver_status_enum" AS ENUM (
        'available',
        'on_route',
        'unavailable',
        'blocked',
        'vacation'
      )
    `);

    // Criar tabela drivers
    await queryRunner.createTable(
      new Table({
        name: 'drivers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'cpf',
            type: 'varchar',
            length: '11',
            isUnique: true,
            isNullable: false,
            comment: 'CPF do motorista (apenas números)',
          },
          {
            name: 'full_name',
            type: 'varchar',
            length: '100',
            isNullable: false,
            comment: 'Nome completo do motorista',
          },
          {
            name: 'birth_date',
            type: 'date',
            isNullable: false,
            comment: 'Data de nascimento do motorista',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '100',
            isUnique: true,
            isNullable: false,
            comment: 'Email do motorista',
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '20',
            isNullable: false,
            comment: 'Telefone do motorista',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['available', 'on_route', 'unavailable', 'blocked', 'vacation'],
            default: "'available'",
            isNullable: false,
            comment: 'Status operacional do motorista',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
            comment: 'Indica se o motorista está ativo',
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
            comment: 'Data de criação do registro',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
            comment: 'Data da última atualização do registro',
          },
        ],
      }),
      true,
    );

    // Criar índices para otimização de consultas
    await queryRunner.createIndex(
      'drivers',
      new TableIndex({
        name: 'IDX_drivers_cpf',
        columnNames: ['cpf'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'drivers',
      new TableIndex({
        name: 'IDX_drivers_email',
        columnNames: ['email'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'drivers',
      new TableIndex({
        name: 'IDX_drivers_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'drivers',
      new TableIndex({
        name: 'IDX_drivers_is_active',
        columnNames: ['is_active'],
      }),
    );

    await queryRunner.createIndex(
      'drivers',
      new TableIndex({
        name: 'IDX_drivers_created_at',
        columnNames: ['created_at'],
      }),
    );

    await queryRunner.createIndex(
      'drivers',
      new TableIndex({
        name: 'IDX_drivers_full_name',
        columnNames: ['full_name'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.dropIndex('drivers', 'IDX_drivers_full_name');
    await queryRunner.dropIndex('drivers', 'IDX_drivers_created_at');
    await queryRunner.dropIndex('drivers', 'IDX_drivers_is_active');
    await queryRunner.dropIndex('drivers', 'IDX_drivers_status');
    await queryRunner.dropIndex('drivers', 'IDX_drivers_email');
    await queryRunner.dropIndex('drivers', 'IDX_drivers_cpf');

    // Remover tabela
    await queryRunner.dropTable('drivers');

    // Remover enum
    await queryRunner.query(`DROP TYPE "driver_status_enum"`);
  }
}
