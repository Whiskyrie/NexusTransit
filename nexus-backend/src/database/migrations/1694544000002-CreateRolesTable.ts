import { Table, type MigrationInterface, type QueryRunner } from 'typeorm';

export class CreateRolesTable1694544000002 implements MigrationInterface {
  name = 'CreateRolesTable1694544000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enum para role_type
    await queryRunner.query(`
      CREATE TYPE "role_type_enum" AS ENUM(
        'super_admin',
        'admin', 
        'manager',
        'operator',
        'driver',
        'customer'
      )
    `);

    // Criar tabela roles
    await queryRunner.createTable(
      new Table({
        name: 'roles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isUnique: true,
            comment: 'Nome único do papel',
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Descrição do papel',
          },
          {
            name: 'type',
            type: 'role_type_enum',
            comment: 'Tipo do papel no sistema',
          },
          {
            name: 'permissions',
            type: 'jsonb',
            default: "'[]'",
            comment: 'Lista de permissões do papel',
          },
          {
            name: 'hierarchy_level',
            type: 'integer',
            default: 0,
            comment: 'Nível hierárquico do papel (0 = maior autoridade)',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            comment: 'Papel está ativo',
          },
          {
            name: 'settings',
            type: 'jsonb',
            isNullable: true,
            comment: 'Configurações específicas do papel',
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
        ],
        indices: [
          {
            name: 'IDX_roles_name',
            columnNames: ['name'],
          },
          {
            name: 'IDX_roles_type',
            columnNames: ['type'],
          },
          {
            name: 'IDX_roles_is_active',
            columnNames: ['is_active'],
          },
          {
            name: 'IDX_roles_hierarchy_level',
            columnNames: ['hierarchy_level'],
          },
          {
            name: 'IDX_roles_deleted_at',
            columnNames: ['deleted_at'],
          },
        ],
      }),
      true,
    );

    // Trigger para updated_at
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_roles_updated_at 
        BEFORE UPDATE ON roles 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover trigger
    await queryRunner.query('DROP TRIGGER IF EXISTS update_roles_updated_at ON roles');

    // Remover tabela
    await queryRunner.dropTable('roles');

    // Remover enum
    await queryRunner.query('DROP TYPE IF EXISTS "role_type_enum"');
  }
}
