import {
  type MigrationInterface,
  type QueryRunner,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class AddMissingColumnsToRoutes1694544000103 implements MigrationInterface {
  name = 'AddMissingColumnsToRoutes1694544000103';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Adicionar colunas de relacionamento
    await queryRunner.addColumn(
      'routes',
      new TableColumn({
        name: 'vehicle_id',
        type: 'uuid',
        isNullable: false,
        comment: 'ID do veículo',
      }),
    );

    await queryRunner.addColumn(
      'routes',
      new TableColumn({
        name: 'driver_id',
        type: 'uuid',
        isNullable: false,
        comment: 'ID do motorista',
      }),
    );

    // 2. Adicionar colunas de datas e horários
    await queryRunner.addColumn(
      'routes',
      new TableColumn({
        name: 'planned_date',
        type: 'date',
        isNullable: false,
        comment: 'Data planejada para execução',
      }),
    );

    await queryRunner.addColumn(
      'routes',
      new TableColumn({
        name: 'planned_start_time',
        type: 'time',
        isNullable: true,
        comment: 'Horário de início planejado',
      }),
    );

    await queryRunner.addColumn(
      'routes',
      new TableColumn({
        name: 'planned_end_time',
        type: 'time',
        isNullable: true,
        comment: 'Horário de término planejado',
      }),
    );

    await queryRunner.addColumn(
      'routes',
      new TableColumn({
        name: 'actual_start_time',
        type: 'timestamp with time zone',
        isNullable: true,
        comment: 'Data/hora real de início',
      }),
    );

    await queryRunner.addColumn(
      'routes',
      new TableColumn({
        name: 'actual_end_time',
        type: 'timestamp with time zone',
        isNullable: true,
        comment: 'Data/hora real de término',
      }),
    );

    // 3. Adicionar colunas de métricas
    await queryRunner.addColumn(
      'routes',
      new TableColumn({
        name: 'estimated_distance_km',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true,
        comment: 'Distância total estimada em quilômetros',
      }),
    );

    await queryRunner.addColumn(
      'routes',
      new TableColumn({
        name: 'actual_distance_km',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true,
        comment: 'Distância real percorrida em quilômetros',
      }),
    );

    await queryRunner.addColumn(
      'routes',
      new TableColumn({
        name: 'actual_duration_minutes',
        type: 'integer',
        isNullable: true,
        comment: 'Duração real em minutos',
      }),
    );

    // 4. Adicionar colunas de carga
    await queryRunner.addColumn(
      'routes',
      new TableColumn({
        name: 'total_load_kg',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true,
        comment: 'Carga total da rota em kg',
      }),
    );

    await queryRunner.addColumn(
      'routes',
      new TableColumn({
        name: 'total_volume_m3',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true,
        comment: 'Volume total da rota em m³',
      }),
    );

    await queryRunner.addColumn(
      'routes',
      new TableColumn({
        name: 'fuel_cost_estimate',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true,
        comment: 'Custo estimado de combustível',
      }),
    );

    // 5. Adicionar colunas de cancelamento
    await queryRunner.addColumn(
      'routes',
      new TableColumn({
        name: 'cancellation_reason',
        type: 'text',
        isNullable: true,
        comment: 'Motivo do cancelamento',
      }),
    );

    await queryRunner.addColumn(
      'routes',
      new TableColumn({
        name: 'cancelled_at',
        type: 'timestamp with time zone',
        isNullable: true,
        comment: 'Data/hora do cancelamento',
      }),
    );

    // 6. Criar foreign keys
    await queryRunner.createForeignKey(
      'routes',
      new TableForeignKey({
        name: 'FK_routes_vehicle',
        columnNames: ['vehicle_id'],
        referencedTableName: 'vehicles',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'routes',
      new TableForeignKey({
        name: 'FK_routes_driver',
        columnNames: ['driver_id'],
        referencedTableName: 'drivers',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );

    // 7. Criar índices
    await queryRunner.createIndex(
      'routes',
      new TableIndex({
        name: 'IDX_routes_vehicle_id',
        columnNames: ['vehicle_id'],
      }),
    );

    await queryRunner.createIndex(
      'routes',
      new TableIndex({
        name: 'IDX_routes_driver_id',
        columnNames: ['driver_id'],
      }),
    );

    await queryRunner.createIndex(
      'routes',
      new TableIndex({
        name: 'IDX_routes_planned_date',
        columnNames: ['planned_date'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.dropIndex('routes', 'IDX_routes_planned_date');
    await queryRunner.dropIndex('routes', 'IDX_routes_driver_id');
    await queryRunner.dropIndex('routes', 'IDX_routes_vehicle_id');

    // Remover foreign keys
    await queryRunner.dropForeignKey('routes', 'FK_routes_driver');
    await queryRunner.dropForeignKey('routes', 'FK_routes_vehicle');

    // Remover colunas
    await queryRunner.dropColumn('routes', 'cancelled_at');
    await queryRunner.dropColumn('routes', 'cancellation_reason');
    await queryRunner.dropColumn('routes', 'fuel_cost_estimate');
    await queryRunner.dropColumn('routes', 'total_volume_m3');
    await queryRunner.dropColumn('routes', 'total_load_kg');
    await queryRunner.dropColumn('routes', 'actual_duration_minutes');
    await queryRunner.dropColumn('routes', 'actual_distance_km');
    await queryRunner.dropColumn('routes', 'estimated_distance_km');
    await queryRunner.dropColumn('routes', 'actual_end_time');
    await queryRunner.dropColumn('routes', 'actual_start_time');
    await queryRunner.dropColumn('routes', 'planned_end_time');
    await queryRunner.dropColumn('routes', 'planned_start_time');
    await queryRunner.dropColumn('routes', 'planned_date');
    await queryRunner.dropColumn('routes', 'driver_id');
    await queryRunner.dropColumn('routes', 'vehicle_id');
  }
}
