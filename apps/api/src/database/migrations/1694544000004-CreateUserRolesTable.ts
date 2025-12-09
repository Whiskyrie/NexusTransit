import { Table, type MigrationInterface, type QueryRunner } from 'typeorm';

export class CreateUserRolesTable1694544000004 implements MigrationInterface {
  name = 'CreateUserRolesTable1694544000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela de relacionamento user_roles (Many-to-Many)
    await queryRunner.createTable(
      new Table({
        name: 'user_roles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            comment: 'ID do usuário',
          },
          {
            name: 'role_id',
            type: 'uuid',
            comment: 'ID do papel',
          },
          {
            name: 'assigned_by',
            type: 'uuid',
            isNullable: true,
            comment: 'ID do usuário que atribuiu o papel',
          },
          {
            name: 'assigned_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Data/hora da atribuição',
          },
          {
            name: 'expires_at',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'Data/hora de expiração do papel (opcional)',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            comment: 'Indica se a atribuição está ativa',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Metadados adicionais da atribuição',
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
        ],
        indices: [
          {
            name: 'IDX_user_roles_user_id',
            columnNames: ['user_id'],
          },
          {
            name: 'IDX_user_roles_role_id',
            columnNames: ['role_id'],
          },
          {
            name: 'IDX_user_roles_assigned_by',
            columnNames: ['assigned_by'],
          },
          {
            name: 'IDX_user_roles_is_active',
            columnNames: ['is_active'],
          },
          {
            name: 'IDX_user_roles_expires_at',
            columnNames: ['expires_at'],
          },
          {
            name: 'IDX_user_roles_user_role_unique',
            columnNames: ['user_id', 'role_id'],
            isUnique: true,
          },
        ],
        foreignKeys: [
          {
            name: 'FK_user_roles_user_id',
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            name: 'FK_user_roles_role_id',
            columnNames: ['role_id'],
            referencedTableName: 'roles',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            name: 'FK_user_roles_assigned_by',
            columnNames: ['assigned_by'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Trigger para updated_at
    await queryRunner.query(`
      CREATE TRIGGER update_user_roles_updated_at 
        BEFORE UPDATE ON user_roles 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column()
    `);

    // Função para verificar papéis expirados
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION check_expired_user_roles()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Desativar papéis expirados automaticamente
        UPDATE user_roles 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE expires_at IS NOT NULL 
          AND expires_at < CURRENT_TIMESTAMP 
          AND is_active = true;
        
        RETURN NULL;
      END;
      $$ language 'plpgsql';
    `);

    // Trigger para verificar expiração a cada inserção/atualização
    await queryRunner.query(`
      CREATE TRIGGER check_expired_roles_trigger
        AFTER INSERT OR UPDATE ON user_roles
        FOR EACH STATEMENT
        EXECUTE FUNCTION check_expired_user_roles()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover triggers
    await queryRunner.query('DROP TRIGGER IF EXISTS check_expired_roles_trigger ON user_roles');
    await queryRunner.query('DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles');

    // Remover função
    await queryRunner.query('DROP FUNCTION IF EXISTS check_expired_user_roles()');

    // Remover tabela
    await queryRunner.dropTable('user_roles');
  }
}
