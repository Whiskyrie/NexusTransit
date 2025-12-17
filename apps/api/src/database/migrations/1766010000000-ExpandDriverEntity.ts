import { type MigrationInterface, type QueryRunner, TableColumn } from 'typeorm';

export class ExpandDriverEntity1766010000000 implements MigrationInterface {
  name = 'ExpandDriverEntity1766010000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ===================================
    // Campos de CNH/Habilitação
    // ===================================
    await queryRunner.addColumn(
      'drivers',
      new TableColumn({
        name: 'license_state',
        type: 'varchar',
        length: '2',
        isNullable: true,
        comment: 'UF emissora da CNH',
      }),
    );

    // ===================================
    // Campos de MOPP
    // ===================================
    await queryRunner.addColumn(
      'drivers',
      new TableColumn({
        name: 'has_mopp',
        type: 'boolean',
        default: false,
        comment: 'Indica se o motorista possui certificação MOPP',
      }),
    );

    await queryRunner.addColumn(
      'drivers',
      new TableColumn({
        name: 'mopp_certificate_number',
        type: 'varchar',
        length: '50',
        isNullable: true,
        comment: 'Número do certificado MOPP',
      }),
    );

    await queryRunner.addColumn(
      'drivers',
      new TableColumn({
        name: 'mopp_expiry_date',
        type: 'date',
        isNullable: true,
        comment: 'Data de vencimento do certificado MOPP',
      }),
    );

    // ===================================
    // Campos de Emprego
    // ===================================
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "employment_type_enum" AS ENUM ('CLT', 'PJ', 'TEMPORARY', 'OUTSOURCED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.addColumn(
      'drivers',
      new TableColumn({
        name: 'employment_type',
        type: 'enum',
        enum: ['CLT', 'PJ', 'TEMPORARY', 'OUTSOURCED'],
        isNullable: true,
        comment: 'Tipo de vínculo empregatício',
      }),
    );

    await queryRunner.addColumn(
      'drivers',
      new TableColumn({
        name: 'hire_date',
        type: 'date',
        isNullable: true,
        comment: 'Data de contratação do motorista',
      }),
    );

    // ===================================
    // Contato de Emergência
    // ===================================
    await queryRunner.addColumn(
      'drivers',
      new TableColumn({
        name: 'emergency_contact_name',
        type: 'varchar',
        length: '100',
        isNullable: true,
        comment: 'Nome do contato de emergência',
      }),
    );

    await queryRunner.addColumn(
      'drivers',
      new TableColumn({
        name: 'emergency_contact_phone',
        type: 'varchar',
        length: '20',
        isNullable: true,
        comment: 'Telefone do contato de emergência',
      }),
    );

    // ===================================
    // Veículo Atual
    // ===================================
    await queryRunner.addColumn(
      'drivers',
      new TableColumn({
        name: 'current_vehicle_id',
        type: 'uuid',
        isNullable: true,
        comment: 'ID do veículo atualmente atribuído ao motorista',
      }),
    );

    // ===================================
    // Métricas e Estatísticas
    // ===================================
    await queryRunner.addColumn(
      'drivers',
      new TableColumn({
        name: 'total_trips',
        type: 'integer',
        default: 0,
        comment: 'Total de viagens realizadas pelo motorista',
      }),
    );

    await queryRunner.addColumn(
      'drivers',
      new TableColumn({
        name: 'total_distance',
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
        comment: 'Total de quilômetros rodados pelo motorista',
      }),
    );

    await queryRunner.addColumn(
      'drivers',
      new TableColumn({
        name: 'rating_average',
        type: 'decimal',
        precision: 3,
        scale: 2,
        isNullable: true,
        comment: 'Avaliação média do motorista (0-5)',
      }),
    );

    // ===================================
    // Observações
    // ===================================
    await queryRunner.addColumn(
      'drivers',
      new TableColumn({
        name: 'notes',
        type: 'text',
        isNullable: true,
        comment: 'Observações gerais sobre o motorista',
      }),
    );

    // ===================================
    // Atualizar enum DriverStatus
    // ===================================
    await queryRunner.query(`
      DO $$ BEGIN
        -- Adicionar novos valores ao enum se ainda não existirem
        ALTER TYPE "driver_status_enum" ADD VALUE IF NOT EXISTS 'ACTIVE';
        ALTER TYPE "driver_status_enum" ADD VALUE IF NOT EXISTS 'INACTIVE';
        ALTER TYPE "driver_status_enum" ADD VALUE IF NOT EXISTS 'SUSPENDED';
        ALTER TYPE "driver_status_enum" ADD VALUE IF NOT EXISTS 'ON_LEAVE';
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // ===================================
    // Criar índices
    // ===================================
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_drivers_has_mopp" ON "drivers" ("has_mopp")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_drivers_employment_type" ON "drivers" ("employment_type")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_drivers_current_vehicle_id" ON "drivers" ("current_vehicle_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_drivers_mopp_expiry_date" ON "drivers" ("mopp_expiry_date")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ===================================
    // Remover índices
    // ===================================
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_drivers_mopp_expiry_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_drivers_current_vehicle_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_drivers_employment_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_drivers_has_mopp"`);

    // ===================================
    // Remover colunas
    // ===================================
    await queryRunner.dropColumn('drivers', 'notes');
    await queryRunner.dropColumn('drivers', 'rating_average');
    await queryRunner.dropColumn('drivers', 'total_distance');
    await queryRunner.dropColumn('drivers', 'total_trips');
    await queryRunner.dropColumn('drivers', 'current_vehicle_id');
    await queryRunner.dropColumn('drivers', 'emergency_contact_phone');
    await queryRunner.dropColumn('drivers', 'emergency_contact_name');
    await queryRunner.dropColumn('drivers', 'hire_date');
    await queryRunner.dropColumn('drivers', 'employment_type');
    await queryRunner.dropColumn('drivers', 'mopp_expiry_date');
    await queryRunner.dropColumn('drivers', 'mopp_certificate_number');
    await queryRunner.dropColumn('drivers', 'has_mopp');
    await queryRunner.dropColumn('drivers', 'license_state');

    // Não remover o enum employment_type_enum pois pode estar sendo usado por outras tabelas
    // await queryRunner.query(`DROP TYPE IF EXISTS "employment_type_enum"`);
  }
}
