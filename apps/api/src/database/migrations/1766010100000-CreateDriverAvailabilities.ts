import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateDriverAvailabilities1766010100000 implements MigrationInterface {
  name = 'CreateDriverAvailabilities1766010100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ===================================
    // Criar enum AvailabilityType
    // ===================================
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "availability_type_enum" AS ENUM (
          'AVAILABLE',
          'VACATION',
          'SICK_LEAVE',
          'SUSPENDED',
          'TRAINING',
          'OTHER'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // ===================================
    // Criar tabela driver_availabilities
    // ===================================
    await queryRunner.createTable(
      new Table({
        name: 'driver_availabilities',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
            comment: 'ID único do registro',
          },
          {
            name: 'driver_id',
            type: 'uuid',
            isNullable: false,
            comment: 'ID do motorista',
          },
          {
            name: 'availability_type',
            type: 'enum',
            enum: ['AVAILABLE', 'VACATION', 'SICK_LEAVE', 'SUSPENDED', 'TRAINING', 'OTHER'],
            isNullable: false,
            comment: 'Tipo de disponibilidade/ausência',
          },
          {
            name: 'start_date',
            type: 'date',
            isNullable: false,
            comment: 'Data de início do período',
          },
          {
            name: 'end_date',
            type: 'date',
            isNullable: false,
            comment: 'Data de término do período',
          },
          {
            name: 'reason',
            type: 'varchar',
            length: '500',
            isNullable: true,
            comment: 'Motivo da indisponibilidade',
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
            comment: 'Observações adicionais',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            comment: 'Indica se o registro está ativo',
          },
          {
            name: 'is_approved',
            type: 'boolean',
            default: false,
            comment: 'Indica se foi aprovado por um supervisor',
          },
          {
            name: 'approved_by',
            type: 'uuid',
            isNullable: true,
            comment: 'ID do usuário que aprovou',
          },
          {
            name: 'approved_at',
            type: 'timestamp',
            isNullable: true,
            comment: 'Data/hora da aprovação',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Data de criação do registro',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Data de última atualização',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
            comment: 'Data de exclusão lógica',
          },
        ],
      }),
      true,
    );

    // ===================================
    // Criar Foreign Key para drivers
    // ===================================
    await queryRunner.createForeignKey(
      'driver_availabilities',
      new TableForeignKey({
        name: 'FK_driver_availabilities_driver',
        columnNames: ['driver_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'drivers',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    // ===================================
    // Criar Foreign Key para approved_by (users)
    // ===================================
    await queryRunner.createForeignKey(
      'driver_availabilities',
      new TableForeignKey({
        name: 'FK_driver_availabilities_approved_by',
        columnNames: ['approved_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );

    // ===================================
    // Criar índices para otimização
    // ===================================
    await queryRunner.createIndex(
      'driver_availabilities',
      new TableIndex({
        name: 'IDX_driver_availabilities_driver_id',
        columnNames: ['driver_id'],
      }),
    );

    await queryRunner.createIndex(
      'driver_availabilities',
      new TableIndex({
        name: 'IDX_driver_availabilities_type',
        columnNames: ['availability_type'],
      }),
    );

    await queryRunner.createIndex(
      'driver_availabilities',
      new TableIndex({
        name: 'IDX_driver_availabilities_dates',
        columnNames: ['start_date', 'end_date'],
      }),
    );

    await queryRunner.createIndex(
      'driver_availabilities',
      new TableIndex({
        name: 'IDX_driver_availabilities_is_active',
        columnNames: ['is_active'],
      }),
    );

    await queryRunner.createIndex(
      'driver_availabilities',
      new TableIndex({
        name: 'IDX_driver_availabilities_is_approved',
        columnNames: ['is_approved'],
      }),
    );

    await queryRunner.createIndex(
      'driver_availabilities',
      new TableIndex({
        name: 'IDX_driver_availabilities_driver_dates',
        columnNames: ['driver_id', 'start_date', 'end_date'],
      }),
    );

    // ===================================
    // Criar índice composto para buscar disponibilidade em período
    // ===================================
    await queryRunner.createIndex(
      'driver_availabilities',
      new TableIndex({
        name: 'IDX_driver_availabilities_driver_active_dates',
        columnNames: ['driver_id', 'is_active', 'start_date', 'end_date'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ===================================
    // Remover índices
    // ===================================
    await queryRunner.dropIndex(
      'driver_availabilities',
      'IDX_driver_availabilities_driver_active_dates',
    );
    await queryRunner.dropIndex('driver_availabilities', 'IDX_driver_availabilities_driver_dates');
    await queryRunner.dropIndex('driver_availabilities', 'IDX_driver_availabilities_is_approved');
    await queryRunner.dropIndex('driver_availabilities', 'IDX_driver_availabilities_is_active');
    await queryRunner.dropIndex('driver_availabilities', 'IDX_driver_availabilities_dates');
    await queryRunner.dropIndex('driver_availabilities', 'IDX_driver_availabilities_type');
    await queryRunner.dropIndex('driver_availabilities', 'IDX_driver_availabilities_driver_id');

    // ===================================
    // Remover Foreign Keys
    // ===================================
    await queryRunner.dropForeignKey(
      'driver_availabilities',
      'FK_driver_availabilities_approved_by',
    );
    await queryRunner.dropForeignKey('driver_availabilities', 'FK_driver_availabilities_driver');

    // ===================================
    // Remover tabela
    // ===================================
    await queryRunner.dropTable('driver_availabilities', true);

    // Não remover o enum pois pode estar sendo usado por outras tabelas
    // await queryRunner.query(`DROP TYPE IF EXISTS "availability_type_enum"`);
  }
}
