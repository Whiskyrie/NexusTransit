import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateDashboardSnapshotsTable1731513600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enum para DashboardPeriod
    await queryRunner.query(`
      CREATE TYPE "dashboard_period_enum" AS ENUM (
        'TODAY',
        'LAST_7_DAYS',
        'LAST_30_DAYS',
        'CURRENT_MONTH',
        'LAST_MONTH',
        'LAST_3_MONTHS',
        'LAST_6_MONTHS',
        'CURRENT_YEAR',
        'CUSTOM'
      );
    `);

    // Criar enum para MetricType
    await queryRunner.query(`
      CREATE TYPE "metric_type_enum" AS ENUM (
        'KPI',
        'PERFORMANCE',
        'FINANCIAL',
        'OPERATIONAL',
        'QUALITY',
        'SATISFACTION'
      );
    `);

    // Criar tabela dashboard_snapshots
    await queryRunner.createTable(
      new Table({
        name: 'dashboard_snapshots',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
            comment: 'ID único do snapshot',
          },
          {
            name: 'period',
            type: 'dashboard_period_enum',
            comment: 'Período de tempo do snapshot',
          },
          {
            name: 'snapshot_date',
            type: 'date',
            comment: 'Data do snapshot',
          },
          {
            name: 'period_start_date',
            type: 'timestamp with time zone',
            comment: 'Data de início do período analisado',
          },
          {
            name: 'period_end_date',
            type: 'timestamp with time zone',
            comment: 'Data de fim do período analisado',
          },
          {
            name: 'metric_type',
            type: 'metric_type_enum',
            comment: 'Tipo de métrica armazenada',
          },
          {
            name: 'delivery_metrics',
            type: 'jsonb',
            isNullable: true,
            comment: 'Métricas consolidadas de entregas',
          },
          {
            name: 'driver_metrics',
            type: 'jsonb',
            isNullable: true,
            comment: 'Métricas consolidadas de motoristas',
          },
          {
            name: 'vehicle_metrics',
            type: 'jsonb',
            isNullable: true,
            comment: 'Métricas consolidadas de veículos',
          },
          {
            name: 'route_metrics',
            type: 'jsonb',
            isNullable: true,
            comment: 'Métricas consolidadas de rotas',
          },
          {
            name: 'financial_metrics',
            type: 'jsonb',
            isNullable: true,
            comment: 'Métricas financeiras consolidadas',
          },
          {
            name: 'performance_metrics',
            type: 'jsonb',
            isNullable: true,
            comment: 'Métricas de performance consolidadas',
          },
          {
            name: 'comparison_data',
            type: 'jsonb',
            isNullable: true,
            comment: 'Variações em relação ao período anterior',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Informações adicionais do snapshot',
          },
          {
            name: 'is_official',
            type: 'boolean',
            default: false,
            comment: 'Indica se é um snapshot oficial (gerado automaticamente)',
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
            comment: 'Observações sobre o snapshot',
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Data de criação do registro',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Data de última atualização do registro',
          },
          {
            name: 'deleted_at',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'Data de exclusão do registro (soft delete)',
          },
        ],
      }),
      true,
    );

    // Criar índices
    await queryRunner.createIndex(
      'dashboard_snapshots',
      new TableIndex({
        name: 'IDX_dashboard_snapshots_period',
        columnNames: ['period'],
      }),
    );

    await queryRunner.createIndex(
      'dashboard_snapshots',
      new TableIndex({
        name: 'IDX_dashboard_snapshots_snapshot_date',
        columnNames: ['snapshot_date'],
      }),
    );

    await queryRunner.createIndex(
      'dashboard_snapshots',
      new TableIndex({
        name: 'IDX_dashboard_snapshots_metric_type',
        columnNames: ['metric_type'],
      }),
    );

    await queryRunner.createIndex(
      'dashboard_snapshots',
      new TableIndex({
        name: 'IDX_dashboard_snapshots_created_at',
        columnNames: ['created_at'],
      }),
    );

    // Criar índice composto para consultas comuns
    await queryRunner.createIndex(
      'dashboard_snapshots',
      new TableIndex({
        name: 'IDX_dashboard_snapshots_period_date',
        columnNames: ['period', 'snapshot_date', 'is_official'],
      }),
    );

    // Adicionar comentário na tabela
    await queryRunner.query(`
      COMMENT ON TABLE "dashboard_snapshots" IS 'Armazena snapshots de métricas do dashboard para histórico e análise de tendências';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.dropIndex('dashboard_snapshots', 'IDX_dashboard_snapshots_period_date');
    await queryRunner.dropIndex('dashboard_snapshots', 'IDX_dashboard_snapshots_created_at');
    await queryRunner.dropIndex('dashboard_snapshots', 'IDX_dashboard_snapshots_metric_type');
    await queryRunner.dropIndex('dashboard_snapshots', 'IDX_dashboard_snapshots_snapshot_date');
    await queryRunner.dropIndex('dashboard_snapshots', 'IDX_dashboard_snapshots_period');

    // Remover tabela
    await queryRunner.dropTable('dashboard_snapshots');

    // Remover enums
    await queryRunner.query(`DROP TYPE "metric_type_enum";`);
    await queryRunner.query(`DROP TYPE "dashboard_period_enum";`);
  }
}
