import { type MigrationInterface, type QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateIncidentAttachmentsAndComments1766110700000 implements MigrationInterface {
  name = 'CreateIncidentAttachmentsAndComments1766110700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar ENUM para tipo de anexo
    await queryRunner.query(`
      CREATE TYPE "incident_attachments_file_type_enum" AS ENUM(
        'PHOTO',
        'VIDEO',
        'DOCUMENT',
        'AUDIO'
      )
    `);

    // Criar tabela incident_attachments
    await queryRunner.createTable(
      new Table({
        name: 'incident_attachments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'deleted_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'incident_id',
            type: 'uuid',
          },
          {
            name: 'file_type',
            type: 'incident_attachments_file_type_enum',
            comment: 'Tipo do anexo',
          },
          {
            name: 'file_url',
            type: 'varchar',
            length: '500',
            comment: 'URL do arquivo armazenado no Backblaze B2',
          },
          {
            name: 'file_name',
            type: 'varchar',
            length: '255',
            comment: 'Nome original do arquivo',
          },
          {
            name: 'file_size',
            type: 'integer',
            comment: 'Tamanho do arquivo em bytes',
          },
          {
            name: 'mime_type',
            type: 'varchar',
            length: '100',
            comment: 'Tipo MIME do arquivo',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
            comment: 'Descrição do anexo',
          },
          {
            name: 'uploaded_by_user_id',
            type: 'uuid',
          },
          {
            name: 'uploaded_at',
            type: 'timestamptz',
            default: 'now()',
            comment: 'Data e hora do upload',
          },
        ],
      }),
      true,
    );

    // Criar tabela incident_comments
    await queryRunner.createTable(
      new Table({
        name: 'incident_comments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'deleted_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'incident_id',
            type: 'uuid',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'comment_text',
            type: 'text',
            comment: 'Texto do comentário',
          },
          {
            name: 'is_internal',
            type: 'boolean',
            default: false,
            comment: 'Visível apenas internamente',
          },
        ],
      }),
      true,
    );

    // Criar índices
    await queryRunner.createIndex(
      'incident_attachments',
      new TableIndex({
        name: 'IDX_incident_attachments_incident_id',
        columnNames: ['incident_id'],
      }),
    );

    await queryRunner.createIndex(
      'incident_comments',
      new TableIndex({
        name: 'IDX_incident_comments_incident_id',
        columnNames: ['incident_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.dropIndex('incident_comments', 'IDX_incident_comments_incident_id');
    await queryRunner.dropIndex('incident_attachments', 'IDX_incident_attachments_incident_id');

    // Remover tabelas
    await queryRunner.dropTable('incident_comments');
    await queryRunner.dropTable('incident_attachments');

    // Remover ENUM
    await queryRunner.query(`DROP TYPE "incident_attachments_file_type_enum"`);
  }
}
