import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateDeliveryProofsTable1694544000021 implements MigrationInterface {
  name = 'CreateDeliveryProofsTable1694544000021';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela delivery_proofs
    await queryRunner.createTable(
      new Table({
        name: 'delivery_proofs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'delivery_id',
            type: 'uuid',
            comment: 'ID da entrega',
          },
          {
            name: 'type',
            type: 'proof_type_enum',
            comment: 'Tipo de comprovante',
          },
          {
            name: 'file_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
            comment: 'URL do arquivo de comprovante',
          },
          {
            name: 'file_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Nome do arquivo',
          },
          {
            name: 'file_size',
            type: 'integer',
            isNullable: true,
            comment: 'Tamanho do arquivo em bytes',
          },
          {
            name: 'file_mime_type',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'MIME type do arquivo',
          },
          {
            name: 'file_hash',
            type: 'varchar',
            length: '64',
            isNullable: true,
            comment: 'Hash SHA-256 do arquivo para validação de integridade',
          },
          {
            name: 'validation_status',
            type: 'varchar',
            length: '50',
            default: "'PENDING'",
            comment: 'Status de validação (PENDING, VALIDATED, REJECTED, EXPIRED)',
          },
          {
            name: 'validation_notes',
            type: 'text',
            isNullable: true,
            comment: 'Observações sobre a validação',
          },
          {
            name: 'validated_at',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'Data/hora da validação',
          },
          {
            name: 'validated_by',
            type: 'uuid',
            isNullable: true,
            comment: 'ID do usuário que validou',
          },
          {
            name: 'capture_latitude',
            type: 'decimal',
            precision: 10,
            scale: 8,
            isNullable: true,
            comment: 'Latitude onde o comprovante foi capturado',
          },
          {
            name: 'capture_longitude',
            type: 'decimal',
            precision: 11,
            scale: 8,
            isNullable: true,
            comment: 'Longitude onde o comprovante foi capturado',
          },
          {
            name: 'capture_timestamp',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Data/hora da captura',
          },
          {
            name: 'device_info',
            type: 'jsonb',
            isNullable: true,
            comment: 'Informações do dispositivo usado (JSON com model, os, app_version)',
          },
          {
            name: 'type_specific_data',
            type: 'jsonb',
            isNullable: true,
            comment: 'Dados específicos por tipo de comprovante (JSON variável)',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Metadados adicionais',
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
      }),
      true,
    );

    // Criar índices
    await queryRunner.createIndex(
      'delivery_proofs',
      new TableIndex({
        name: 'IDX_PROOF_DELIVERY',
        columnNames: ['delivery_id'],
      }),
    );

    await queryRunner.createIndex(
      'delivery_proofs',
      new TableIndex({
        name: 'IDX_PROOF_TYPE',
        columnNames: ['type'],
      }),
    );

    await queryRunner.createIndex(
      'delivery_proofs',
      new TableIndex({
        name: 'IDX_PROOF_VALIDATION_STATUS',
        columnNames: ['validation_status'],
      }),
    );

    await queryRunner.createIndex(
      'delivery_proofs',
      new TableIndex({
        name: 'IDX_PROOF_CAPTURE_TIMESTAMP',
        columnNames: ['capture_timestamp'],
      }),
    );

    await queryRunner.createIndex(
      'delivery_proofs',
      new TableIndex({
        name: 'IDX_PROOF_FILE_HASH',
        columnNames: ['file_hash'],
      }),
    );

    // Índice composto para buscar comprovantes por entrega e tipo
    await queryRunner.createIndex(
      'delivery_proofs',
      new TableIndex({
        name: 'IDX_PROOF_DELIVERY_TYPE',
        columnNames: ['delivery_id', 'type'],
      }),
    );

    // Criar foreign key
    await queryRunner.createForeignKey(
      'delivery_proofs',
      new TableForeignKey({
        name: 'FK_PROOF_DELIVERY',
        columnNames: ['delivery_id'],
        referencedTableName: 'deliveries',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'delivery_proofs',
      new TableForeignKey({
        name: 'FK_PROOF_VALIDATED_BY',
        columnNames: ['validated_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover foreign keys
    await queryRunner.dropForeignKey('delivery_proofs', 'FK_PROOF_VALIDATED_BY');
    await queryRunner.dropForeignKey('delivery_proofs', 'FK_PROOF_DELIVERY');

    // Remover índices
    await queryRunner.dropIndex('delivery_proofs', 'IDX_PROOF_DELIVERY_TYPE');
    await queryRunner.dropIndex('delivery_proofs', 'IDX_PROOF_FILE_HASH');
    await queryRunner.dropIndex('delivery_proofs', 'IDX_PROOF_CAPTURE_TIMESTAMP');
    await queryRunner.dropIndex('delivery_proofs', 'IDX_PROOF_VALIDATION_STATUS');
    await queryRunner.dropIndex('delivery_proofs', 'IDX_PROOF_TYPE');
    await queryRunner.dropIndex('delivery_proofs', 'IDX_PROOF_DELIVERY');

    // Remover tabela
    await queryRunner.dropTable('delivery_proofs');
  }
}
