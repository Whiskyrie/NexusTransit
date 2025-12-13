import { type MigrationInterface, type QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateUserConsentsTable1694544000007 implements MigrationInterface {
  name = 'CreateUserConsentsTable1694544000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enum para tipos de consentimento
    await queryRunner.query(`
      CREATE TYPE "consent_type_enum" AS ENUM (
        'basic_data_processing',
        'marketing_communications',
        'analytics_and_improvements',
        'third_party_sharing',
        'location_tracking',
        'push_notifications'
      )
    `);

    // Criar tabela user_consents
    await queryRunner.createTable(
      new Table({
        name: 'user_consents',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'consent_type',
            type: 'consent_type_enum',
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'terms_version',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'consent_ip',
            type: 'inet',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'collection_method',
            type: 'varchar',
            length: '50',
            default: "'web'",
            isNullable: false,
          },
          {
            name: 'purpose_description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'revoked_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'revocation_reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Criar índices
    await queryRunner.createIndex(
      'user_consents',
      new TableIndex({ name: 'IDX_USER_CONSENTS_USER_ID', columnNames: ['user_id'] }),
    );

    await queryRunner.createIndex(
      'user_consents',
      new TableIndex({
        name: 'IDX_USER_CONSENTS_USER_CONSENT_TYPE',
        columnNames: ['user_id', 'consent_type'],
      }),
    );

    await queryRunner.createIndex(
      'user_consents',
      new TableIndex({
        name: 'IDX_USER_CONSENTS_USER_ACTIVE',
        columnNames: ['user_id', 'is_active'],
      }),
    );

    await queryRunner.createIndex(
      'user_consents',
      new TableIndex({
        name: 'IDX_USER_CONSENTS_CONSENT_TYPE_ACTIVE',
        columnNames: ['consent_type', 'is_active'],
      }),
    );

    // Adicionar trigger para updated_at
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
      CREATE TRIGGER update_user_consents_updated_at
        BEFORE UPDATE ON user_consents
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover trigger
    await queryRunner.query(
      'DROP TRIGGER IF EXISTS update_user_consents_updated_at ON user_consents',
    );

    // Remover índices
    await queryRunner.dropIndex('user_consents', 'IDX_USER_CONSENTS_CONSENT_TYPE_ACTIVE');
    await queryRunner.dropIndex('user_consents', 'IDX_USER_CONSENTS_USER_ACTIVE');
    await queryRunner.dropIndex('user_consents', 'IDX_USER_CONSENTS_USER_CONSENT_TYPE');
    await queryRunner.dropIndex('user_consents', 'IDX_USER_CONSENTS_USER_ID');

    // Remover tabela
    await queryRunner.dropTable('user_consents');

    // Remover enum
    await queryRunner.query('DROP TYPE "consent_type_enum"');
  }
}
