import { type MigrationInterface, type QueryRunner, TableColumn } from 'typeorm';

/**
 * Migration: Atualizar campos de tempo das rotas
 *
 * Mudanças:
 * - Remove planned_end_time (hora de fim) - não faz sentido para rotas longas/interestaduais
 * - Adiciona estimated_end_date (data estimada de término) - calculada via Google Maps API
 * - Mantém planned_start_time como horário de início da rota
 *
 * Justificativa:
 * Para rotas interestaduais e de longa distância, definir apenas horário de início/fim
 * no mesmo dia não faz sentido. A API do Google Maps fornece duração estimada que pode
 * ser de vários dias, então precisamos armazenar a data estimada de término.
 */
export class UpdateRouteTimeFields1736040000000 implements MigrationInterface {
  name = 'UpdateRouteTimeFields1736040000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Adicionar coluna estimated_end_date (data estimada de término)
    await queryRunner.addColumn(
      'routes',
      new TableColumn({
        name: 'estimated_end_date',
        type: 'timestamp with time zone',
        isNullable: true,
        comment:
          'Data/hora estimada de término (calculada: planned_date + planned_start_time + estimated_duration_minutes)',
      }),
    );

    // 2. Calcular estimated_end_date para rotas existentes
    // Se tiver planned_date, planned_start_time e estimated_duration_minutes
    await queryRunner.query(`
      UPDATE routes
      SET estimated_end_date = (
        (planned_date::text || ' ' || COALESCE(planned_start_time::text, '00:00:00'))::timestamp
        + (COALESCE(estimated_duration_minutes, 0) || ' minutes')::interval
      )
      WHERE planned_date IS NOT NULL
        AND estimated_duration_minutes IS NOT NULL
        AND estimated_end_date IS NULL;
    `);

    // 3. Remover planned_end_time (não faz mais sentido)
    await queryRunner.dropColumn('routes', 'planned_end_time');

    // 4. Adicionar comentário explicativo na coluna estimated_duration_minutes
    await queryRunner.query(`
      COMMENT ON COLUMN routes.estimated_duration_minutes IS 'Duração estimada da rota em minutos (obtida via Google Maps API)';
    `);

    // 5. Adicionar índice para consultas por data estimada de término
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_routes_estimated_end_date" 
      ON "routes" ("estimated_end_date");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Remover índice
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_routes_estimated_end_date";`);

    // 2. Adicionar de volta planned_end_time
    await queryRunner.addColumn(
      'routes',
      new TableColumn({
        name: 'planned_end_time',
        type: 'time',
        isNullable: true,
        comment: 'Horário de término planejado',
      }),
    );

    // 3. Tentar restaurar planned_end_time a partir de estimated_end_date
    await queryRunner.query(`
      UPDATE routes
      SET planned_end_time = estimated_end_date::time
      WHERE estimated_end_date IS NOT NULL;
    `);

    // 4. Remover estimated_end_date
    await queryRunner.dropColumn('routes', 'estimated_end_date');

    // 5. Restaurar comentário original
    await queryRunner.query(`
      COMMENT ON COLUMN routes.estimated_duration_minutes IS 'Tempo estimado de viagem em minutos';
    `);
  }
}
