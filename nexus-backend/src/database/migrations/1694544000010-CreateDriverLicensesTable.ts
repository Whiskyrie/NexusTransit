import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateDriverLicensesTable1694544000010 implements MigrationInterface {
  name = 'CreateDriverLicensesTable1694544000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enum para categorias de CNH
    await queryRunner.query(`
      CREATE TYPE "cnh_category_enum" AS ENUM (
        'a',
        'b',
        'c',
        'd',
        'e',
        'ab',
        'ac',
        'ad',
        'ae'
      )
    `);

    // Criar tabela driver_licenses
    await queryRunner.createTable(
      new Table({
        name: 'driver_licenses',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'license_number',
            type: 'varchar',
            length: '11',
            isUnique: true,
            isNullable: false,
            comment: 'Número da CNH',
          },
          {
            name: 'category',
            type: 'enum',
            enum: ['a', 'b', 'c', 'd', 'e', 'ab', 'ac', 'ad', 'ae'],
            isNullable: false,
            comment: 'Categoria da CNH',
          },
          {
            name: 'issue_date',
            type: 'date',
            isNullable: false,
            comment: 'Data de emissão da CNH',
          },
          {
            name: 'expiration_date',
            type: 'date',
            isNullable: false,
            comment: 'Data de validade da CNH',
          },
          {
            name: 'issuing_authority',
            type: 'varchar',
            length: '100',
            isNullable: false,
            comment: 'Órgão emissor da CNH',
          },
          {
            name: 'issuing_state',
            type: 'varchar',
            length: '2',
            isNullable: false,
            comment: 'UF do órgão emissor',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
            comment: 'Indica se a CNH está ativa',
          },
          {
            name: 'driver_id',
            type: 'uuid',
            isNullable: false,
            comment: 'ID do motorista proprietário',
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

    // Criar foreign key para drivers
    await queryRunner.createForeignKey(
      'driver_licenses',
      new TableForeignKey({
        columnNames: ['driver_id'],
        referencedTableName: 'drivers',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        name: 'FK_driver_licenses_driver',
      }),
    );

    // Criar índices para otimização de consultas
    await queryRunner.createIndex(
      'driver_licenses',
      new TableIndex({
        name: 'IDX_driver_licenses_license_number',
        columnNames: ['license_number'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'driver_licenses',
      new TableIndex({
        name: 'IDX_driver_licenses_driver_id',
        columnNames: ['driver_id'],
        isUnique: true, // OneToOne relationship
      }),
    );

    await queryRunner.createIndex(
      'driver_licenses',
      new TableIndex({
        name: 'IDX_driver_licenses_category',
        columnNames: ['category'],
      }),
    );

    await queryRunner.createIndex(
      'driver_licenses',
      new TableIndex({
        name: 'IDX_driver_licenses_expiration_date',
        columnNames: ['expiration_date'],
      }),
    );

    await queryRunner.createIndex(
      'driver_licenses',
      new TableIndex({
        name: 'IDX_driver_licenses_is_active',
        columnNames: ['is_active'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.dropIndex('driver_licenses', 'IDX_driver_licenses_is_active');
    await queryRunner.dropIndex('driver_licenses', 'IDX_driver_licenses_expiration_date');
    await queryRunner.dropIndex('driver_licenses', 'IDX_driver_licenses_category');
    await queryRunner.dropIndex('driver_licenses', 'IDX_driver_licenses_driver_id');
    await queryRunner.dropIndex('driver_licenses', 'IDX_driver_licenses_license_number');

    // Remover foreign key
    await queryRunner.dropForeignKey('driver_licenses', 'FK_driver_licenses_driver');

    // Remover tabela
    await queryRunner.dropTable('driver_licenses');

    // Remover enum
    await queryRunner.query(`DROP TYPE "cnh_category_enum"`);
  }
}
