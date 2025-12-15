import { type MigrationInterface, type QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

/**
 * Migration: AddRouteOptimizationFields
 *
 * Adiciona campos de otimização e métricas à tabela de rotas:
 * - optimization_score: Score de 0-100 indicando eficiência da rota
 * - route_points: Array de coordenadas ordenadas da rota otimizada
 * - estimated_fuel_cost: Custo estimado de combustível
 * - fuel_consumption_estimate: Consumo estimado de combustível
 * - Relacionamento com deliveries (para rastreio de entregas por rota)
 */
export class AddRouteOptimizationFields1734220095000 implements MigrationInterface {
  name = 'AddRouteOptimizationFields1734220095000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se a tabela routes existe
    const routesTable = await queryRunner.getTable('routes');
    if (!routesTable) {
      return;
    }

    // Recuperar planned_date se foi renomeado incorretamente para route_date
    // Isso corrige o estado se a migration anterior rodou e renomeou a coluna
    const hasRouteDateInitial = routesTable.columns.some(col => col.name === 'route_date');
    const hasPlannedDateInitial = routesTable.columns.some(col => col.name === 'planned_date');

    if (hasRouteDateInitial && !hasPlannedDateInitial) {
      await queryRunner.renameColumn('routes', 'route_date', 'planned_date');
    }

    // Atualizar referência da tabela
    const routesTableUpdated = await queryRunner.getTable('routes');
    if (!routesTableUpdated) {
      return;
    }

    // Adicionar route_date se não existir
    const hasRouteDate = routesTableUpdated.columns.some(col => col.name === 'route_date');
    if (!hasRouteDate) {
      await queryRunner.addColumn(
        'routes',
        new TableColumn({
          name: 'route_date',
          type: 'date',
          isNullable: true,
          comment: 'Data da rota',
        }),
      );

      // Copiar dados de planned_date se existir
      const hasPlannedDate = routesTableUpdated.columns.some(col => col.name === 'planned_date');
      if (hasPlannedDate) {
        await queryRunner.query(`UPDATE "routes" SET "route_date" = "planned_date"`);
      } else {
        await queryRunner.query(`UPDATE "routes" SET "route_date" = CURRENT_DATE`);
      }

      // Tornar não nulo
      await queryRunner.changeColumn(
        'routes',
        'route_date',
        new TableColumn({
          name: 'route_date',
          type: 'date',
          isNullable: false,
          comment: 'Data da rota',
        }),
      );
    }

    // Adicionar campo optimization_score se não existir
    const hasOptimizationScore = routesTable.columns.some(col => col.name === 'optimization_score');
    if (!hasOptimizationScore) {
      await queryRunner.addColumn(
        'routes',
        new TableColumn({
          name: 'optimization_score',
          type: 'decimal',
          precision: 5,
          scale: 2,
          isNullable: true,
          comment: 'Score de otimização da rota (0-100)',
        }),
      );
    }

    // Adicionar campo route_points (JSONB para array de coordenadas)
    const hasRoutePoints = routesTable.columns.some(col => col.name === 'route_points');
    if (!hasRoutePoints) {
      await queryRunner.addColumn(
        'routes',
        new TableColumn({
          name: 'route_points',
          type: 'jsonb',
          isNullable: true,
          comment: 'Array de pontos GPS da rota otimizada',
        }),
      );
    }

    // Adicionar campo fuel_consumption_estimate
    const hasFuelConsumption = routesTable.columns.some(
      col => col.name === 'fuel_consumption_estimate',
    );
    if (!hasFuelConsumption) {
      await queryRunner.addColumn(
        'routes',
        new TableColumn({
          name: 'fuel_consumption_estimate',
          type: 'decimal',
          precision: 10,
          scale: 2,
          isNullable: true,
          comment: 'Consumo estimado de combustível em litros',
        }),
      );
    }

    // Adicionar campo fuel_cost_estimate
    const hasFuelCost = routesTable.columns.some(col => col.name === 'fuel_cost_estimate');
    if (!hasFuelCost) {
      await queryRunner.addColumn(
        'routes',
        new TableColumn({
          name: 'fuel_cost_estimate',
          type: 'decimal',
          precision: 10,
          scale: 2,
          isNullable: true,
          comment: 'Custo estimado de combustível em reais',
        }),
      );
    }

    // Adicionar campo start_location (Point GeoJSON)
    const hasStartLocation = routesTable.columns.some(col => col.name === 'start_location');
    if (!hasStartLocation) {
      await queryRunner.addColumn(
        'routes',
        new TableColumn({
          name: 'start_location',
          type: 'varchar',
          length: '255',
          isNullable: true,
          comment: 'Coordenadas de início da rota (formato POINT)',
        }),
      );
    }

    // Adicionar campo end_location (Point GeoJSON)
    const hasEndLocation = routesTable.columns.some(col => col.name === 'end_location');
    if (!hasEndLocation) {
      await queryRunner.addColumn(
        'routes',
        new TableColumn({
          name: 'end_location',
          type: 'varchar',
          length: '255',
          isNullable: true,
          comment: 'Coordenadas de fim da rota (formato POINT)',
        }),
      );
    }

    // Adicionar campo actual_start_time
    const hasActualStartTime = routesTable.columns.some(col => col.name === 'actual_start_time');
    if (!hasActualStartTime) {
      await queryRunner.addColumn(
        'routes',
        new TableColumn({
          name: 'actual_start_time',
          type: 'timestamp',
          isNullable: true,
          comment: 'Horário real de início da rota',
        }),
      );
    }

    // Adicionar campo actual_end_time
    const hasActualEndTime = routesTable.columns.some(col => col.name === 'actual_end_time');
    if (!hasActualEndTime) {
      await queryRunner.addColumn(
        'routes',
        new TableColumn({
          name: 'actual_end_time',
          type: 'timestamp',
          isNullable: true,
          comment: 'Horário real de término da rota',
        }),
      );
    }

    // Verificar se a tabela deliveries existe para adicionar a foreign key
    const deliveriesTable = await queryRunner.getTable('deliveries');
    if (deliveriesTable) {
      // Verificar se já existe a coluna route_id na tabela deliveries
      const hasRouteId = deliveriesTable.columns.some(col => col.name === 'route_id');
      if (!hasRouteId) {
        await queryRunner.addColumn(
          'deliveries',
          new TableColumn({
            name: 'route_id',
            type: 'uuid',
            isNullable: true,
            comment: 'ID da rota à qual esta entrega pertence',
          }),
        );

        // Adicionar foreign key
        await queryRunner.createForeignKey(
          'deliveries',
          new TableForeignKey({
            columnNames: ['route_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'routes',
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
            name: 'FK_deliveries_route_id',
          }),
        );
      }
    }

    // Criar índices para melhorar performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_routes_optimization_score" ON "routes" ("optimization_score");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_routes_route_date_status" ON "routes" ("route_date", "status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_routes_optimization_score";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_routes_route_date_status";`);

    // Remover foreign key de deliveries
    const deliveriesTable = await queryRunner.getTable('deliveries');
    if (deliveriesTable) {
      const foreignKey = deliveriesTable.foreignKeys.find(
        fk => fk.name === 'FK_deliveries_route_id',
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('deliveries', foreignKey);
      }

      const hasRouteId = deliveriesTable.columns.some(col => col.name === 'route_id');
      if (hasRouteId) {
        await queryRunner.dropColumn('deliveries', 'route_id');
      }
    }

    // Remover colunas adicionadas
    const routesTable = await queryRunner.getTable('routes');
    if (routesTable) {
      const columnsToRemove = [
        'optimization_score',
        'route_points',
        'fuel_consumption_estimate',
        'fuel_cost_estimate',
        'start_location',
        'end_location',
        'actual_start_time',
        'actual_end_time',
      ];

      for (const columnName of columnsToRemove) {
        const hasColumn = routesTable.columns.some(col => col.name === columnName);
        if (hasColumn) {
          await queryRunner.dropColumn('routes', columnName);
        }
      }
    }
  }
}
