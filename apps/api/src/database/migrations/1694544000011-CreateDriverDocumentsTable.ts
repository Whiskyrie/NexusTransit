import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateDriverDocumentsTable1694544000011 implements MigrationInterface {
  name = 'CreateDriverDocumentsTable1694544000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enum para tipos de documento
    await queryRunner.query(`
      CREATE TYPE "document_type_enum" AS ENUM (
        'cpf',
        'cnh',
        'rg',
        'medical_exam',
        'criminal_record',
        'address_proof',
        'selfie',
        'other'
      )
    `);

    // Criar tabela driver_documents
    await queryRunner.createTable(
      new Table({
        name: 'driver_documents',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'filename',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'Nome do arquivo original',
          },
          {
            name: 'file_path',
            type: 'varchar',
            length: '500',
            isNullable: false,
            comment: 'Caminho do arquivo no storage',
          },
          {
            name: 'mime_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'Tipo MIME do arquivo',
          },
          {
            name: 'file_size',
            type: 'bigint',
            isNullable: false,
            comment: 'Tamanho do arquivo em bytes',
          },
          {
            name: 'document_type',
            type: 'enum',
            enum: [
              'cpf',
              'cnh',
              'rg',
              'medical_exam',
              'criminal_record',
              'address_proof',
              'selfie',
              'other',
            ],
            isNullable: false,
            comment: 'Tipo de documento',
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Descrição opcional do documento',
          },
          {
            name: 'expiration_date',
            type: 'date',
            isNullable: true,
            comment: 'Data de vencimento do documento',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
            comment: 'Indica se o documento está ativo',
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
      'driver_documents',
      new TableForeignKey({
        columnNames: ['driver_id'],
        referencedTableName: 'drivers',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        name: 'FK_driver_documents_driver',
      }),
    );

    // Criar índices para otimização de consultas
    await queryRunner.createIndex(
      'driver_documents',
      new TableIndex({
        name: 'IDX_driver_documents_driver_id',
        columnNames: ['driver_id'],
      }),
    );

    await queryRunner.createIndex(
      'driver_documents',
      new TableIndex({
        name: 'IDX_driver_documents_document_type',
        columnNames: ['document_type'],
      }),
    );

    await queryRunner.createIndex(
      'driver_documents',
      new TableIndex({
        name: 'IDX_driver_documents_expiration_date',
        columnNames: ['expiration_date'],
      }),
    );

    await queryRunner.createIndex(
      'driver_documents',
      new TableIndex({
        name: 'IDX_driver_documents_is_active',
        columnNames: ['is_active'],
      }),
    );

    await queryRunner.createIndex(
      'driver_documents',
      new TableIndex({
        name: 'IDX_driver_documents_created_at',
        columnNames: ['created_at'],
      }),
    );

    // Índice composto para busca otimizada por motorista + tipo de documento
    await queryRunner.createIndex(
      'driver_documents',
      new TableIndex({
        name: 'IDX_driver_documents_driver_type',
        columnNames: ['driver_id', 'document_type'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.dropIndex('driver_documents', 'IDX_driver_documents_driver_type');
    await queryRunner.dropIndex('driver_documents', 'IDX_driver_documents_created_at');
    await queryRunner.dropIndex('driver_documents', 'IDX_driver_documents_is_active');
    await queryRunner.dropIndex('driver_documents', 'IDX_driver_documents_expiration_date');
    await queryRunner.dropIndex('driver_documents', 'IDX_driver_documents_document_type');
    await queryRunner.dropIndex('driver_documents', 'IDX_driver_documents_driver_id');

    // Remover foreign key
    await queryRunner.dropForeignKey('driver_documents', 'FK_driver_documents_driver');

    // Remover tabela
    await queryRunner.dropTable('driver_documents');

    // Remover enum
    await queryRunner.query(`DROP TYPE "document_type_enum"`);
  }
}
