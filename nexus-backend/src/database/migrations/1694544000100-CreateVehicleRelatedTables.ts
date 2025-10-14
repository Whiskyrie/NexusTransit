import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateVehicleRelatedTables1694544000100 implements MigrationInterface {
  name = 'CreateVehicleRelatedTables1694544000100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enums
    await queryRunner.query(`
      CREATE TYPE "vehicle_document_type_enum" AS ENUM (
        'crlv',
        'insurance',
        'ipva',
        'registration',
        'driver_license',
        'inspection',
        'other'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "maintenance_type_enum" AS ENUM (
        'preventive',
        'corrective',
        'review',
        'emergency',
        'inspection',
        'other'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "maintenance_status_enum" AS ENUM (
        'scheduled',
        'in_progress',
        'completed',
        'cancelled'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "driver_assignment_status_enum" AS ENUM (
        'active',
        'inactive',
        'pending'
      )
    `);

    // 1. Criar tabela vehicle_documents
    await queryRunner.createTable(
      new Table({
        name: 'vehicle_documents',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'document_type',
            type: 'enum',
            enum: [
              'crlv',
              'insurance',
              'ipva',
              'registration',
              'driver_license',
              'inspection',
              'other',
            ],
            comment: 'Tipo do documento (CRLV, Seguro, IPVA, etc.)',
          },
          {
            name: 'original_name',
            type: 'varchar',
            length: '255',
            comment: 'Nome original do arquivo enviado',
          },
          {
            name: 'file_path',
            type: 'varchar',
            length: '500',
            comment: 'Caminho completo do arquivo no storage',
          },
          {
            name: 'file_size',
            type: 'varchar',
            length: '20',
            comment: 'Tamanho do arquivo formatado (ex: 2.5 MB)',
          },
          {
            name: 'file_size_bytes',
            type: 'integer',
            comment: 'Tamanho do arquivo em bytes',
          },
          {
            name: 'file_extension',
            type: 'varchar',
            length: '10',
            comment: 'Extensão do arquivo (pdf, jpg, png, etc.)',
          },
          {
            name: 'mime_type',
            type: 'varchar',
            length: '100',
            comment: 'MIME type do arquivo',
          },
          {
            name: 'expiry_date',
            type: 'date',
            isNullable: true,
            comment: 'Data de expiração do documento',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
            comment: 'Descrição ou observações sobre o documento',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            comment: 'Indica se o documento está ativo (não foi removido)',
          },
          {
            name: 'file_hash',
            type: 'varchar',
            length: '64',
            isNullable: true,
            comment: 'Hash SHA-256 do arquivo para verificação de integridade',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Metadados adicionais do arquivo',
          },
          {
            name: 'vehicle_id',
            type: 'uuid',
            comment: 'ID do veículo associado',
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

    // 2. Criar tabela vehicle_maintenances
    await queryRunner.createTable(
      new Table({
        name: 'vehicle_maintenances',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'maintenance_type',
            type: 'enum ',
            enum: ['preventive', 'corrective', 'review', 'emergency', 'inspection', 'other'],
            comment: 'Tipo de manutenção realizada',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
            default: "'scheduled'",
            comment: 'Status atual da manutenção',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '200',
            comment: 'Título ou resumo da manutenção',
          },
          {
            name: 'description',
            type: 'text',
            comment: 'Descrição detalhada dos serviços realizados',
          },
          {
            name: 'cost',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
            comment: 'Custo total da manutenção',
          },
          {
            name: 'maintenance_date',
            type: 'date',
            comment: 'Data em que a manutenção foi realizada ou agendada',
          },
          {
            name: 'start_date',
            type: 'date',
            isNullable: true,
            comment: 'Data de início da manutenção',
          },
          {
            name: 'completion_date',
            type: 'date',
            isNullable: true,
            comment: 'Data de conclusão da manutenção',
          },
          {
            name: 'mileage_at_maintenance',
            type: 'integer',
            comment: 'Quilometragem do veículo no momento da manutenção',
          },
          {
            name: 'service_provider',
            type: 'varchar',
            length: '200',
            isNullable: true,
            comment: 'Nome da oficina ou prestador de serviço',
          },
          {
            name: 'service_provider_contact',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Telefone de contato do prestador de serviço',
          },
          {
            name: 'service_location',
            type: 'text',
            isNullable: true,
            comment: 'Endereço do local onde foi realizada a manutenção',
          },
          {
            name: 'next_maintenance_date',
            type: 'date',
            isNullable: true,
            comment: 'Data programada para a próxima manutenção deste tipo',
          },
          {
            name: 'next_maintenance_mileage',
            type: 'integer',
            isNullable: true,
            comment: 'Quilometragem prevista para a próxima manutenção',
          },
          {
            name: 'service_order_number',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Número da ordem de serviço ou nota fiscal',
          },
          {
            name: 'warranty_period',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Garantia oferecida pelo serviço',
          },
          {
            name: 'warranty_expiry_date',
            type: 'date',
            isNullable: true,
            comment: 'Data de expiração da garantia do serviço',
          },
          {
            name: 'parts_used',
            type: 'jsonb',
            isNullable: true,
            comment: 'Lista de peças utilizadas na manutenção',
          },
          {
            name: 'services_performed',
            type: 'jsonb',
            isNullable: true,
            comment: 'Lista de serviços realizados',
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
            comment: 'Observações adicionais sobre a manutenção',
          },
          {
            name: 'service_rating',
            type: 'integer',
            default: 0,
            comment: 'Avaliação da qualidade do serviço (0-5 estrelas)',
          },
          {
            name: 'rating_comments',
            type: 'text',
            isNullable: true,
            comment: 'Comentários sobre a avaliação do serviço',
          },
          {
            name: 'vehicle_id',
            type: 'uuid',
            comment: 'ID do veículo associado',
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

    // 3. Criar tabela vehicle_driver_histories
    await queryRunner.createTable(
      new Table({
        name: 'vehicle_driver_histories',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'driver_id',
            type: 'uuid',
            comment: 'ID do motorista associado',
          },
          {
            name: 'start_date',
            type: 'timestamp with time zone',
            comment: 'Data e hora de início da associação',
          },
          {
            name: 'end_date',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'Data e hora de término da associação',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive', 'pending'],
            default: "'active'",
            comment: 'Status da associação',
          },
          {
            name: 'reason',
            type: 'text',
            isNullable: true,
            comment: 'Motivo da associação ou observações',
          },
          {
            name: 'is_current',
            type: 'boolean',
            default: false,
            comment: 'Indica se esta é a associação atual',
          },
          {
            name: 'vehicle_id',
            type: 'uuid',
            comment: 'ID do veículo associado',
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

    // Criar Foreign Keys
    await queryRunner.createForeignKey(
      'vehicle_documents',
      new TableForeignKey({
        name: 'fk_vehicle_documents_vehicle',
        columnNames: ['vehicle_id'],
        referencedTableName: 'vehicles',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'vehicle_maintenances',
      new TableForeignKey({
        name: 'fk_vehicle_maintenances_vehicle',
        columnNames: ['vehicle_id'],
        referencedTableName: 'vehicles',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'vehicle_driver_histories',
      new TableForeignKey({
        name: 'fk_vehicle_driver_histories_vehicle',
        columnNames: ['vehicle_id'],
        referencedTableName: 'vehicles',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    // Criar índices
    await queryRunner.createIndex(
      'vehicle_documents',
      new TableIndex({
        name: 'idx_vehicle_documents_vehicle_id',
        columnNames: ['vehicle_id'],
      }),
    );

    await queryRunner.createIndex(
      'vehicle_documents',
      new TableIndex({
        name: 'idx_vehicle_documents_type',
        columnNames: ['document_type'],
      }),
    );

    await queryRunner.createIndex(
      'vehicle_documents',
      new TableIndex({
        name: 'idx_vehicle_documents_expiry_date',
        columnNames: ['expiry_date'],
      }),
    );

    await queryRunner.createIndex(
      'vehicle_maintenances',
      new TableIndex({
        name: 'idx_vehicle_maintenances_vehicle_id',
        columnNames: ['vehicle_id'],
      }),
    );

    await queryRunner.createIndex(
      'vehicle_maintenances',
      new TableIndex({
        name: 'idx_vehicle_maintenances_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'vehicle_maintenances',
      new TableIndex({
        name: 'idx_vehicle_maintenances_type',
        columnNames: ['maintenance_type'],
      }),
    );

    await queryRunner.createIndex(
      'vehicle_maintenances',
      new TableIndex({
        name: 'idx_vehicle_maintenances_date',
        columnNames: ['maintenance_date'],
      }),
    );

    await queryRunner.createIndex(
      'vehicle_driver_histories',
      new TableIndex({
        name: 'idx_vehicle_driver_histories_vehicle_id',
        columnNames: ['vehicle_id'],
      }),
    );

    await queryRunner.createIndex(
      'vehicle_driver_histories',
      new TableIndex({
        name: 'idx_vehicle_driver_histories_driver_id',
        columnNames: ['driver_id'],
      }),
    );

    await queryRunner.createIndex(
      'vehicle_driver_histories',
      new TableIndex({
        name: 'idx_vehicle_driver_histories_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'vehicle_driver_histories',
      new TableIndex({
        name: 'idx_vehicle_driver_histories_is_current',
        columnNames: ['is_current'],
      }),
    );

    // Comentários nas tabelas
    await queryRunner.query(`
      COMMENT ON TABLE "vehicle_documents" IS 'Documentos dos veículos'
    `);

    await queryRunner.query(`
      COMMENT ON TABLE "vehicle_maintenances" IS 'Histórico de manutenções dos veículos'
    `);

    await queryRunner.query(`
      COMMENT ON TABLE "vehicle_driver_histories" IS 'Histórico de associação de veículos a motoristas'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover tabelas
    await queryRunner.dropTable('vehicle_driver_histories');
    await queryRunner.dropTable('vehicle_maintenances');
    await queryRunner.dropTable('vehicle_documents');

    // Remover enums
    await queryRunner.query('DROP TYPE IF EXISTS "driver_assignment_status_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "maintenance_status_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "maintenance_type_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "vehicle_document_type_enum"');
  }
}
