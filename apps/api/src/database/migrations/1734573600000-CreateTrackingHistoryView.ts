import { type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * Migration para criar materialized view de histórico de rastreamento
 *
 * Esta view agrega dados de rastreamento para consultas rápidas, incluindo:
 * - Status atual da entrega
 * - Última localização conhecida
 * - Última atualização
 * - Contagem de eventos
 * - ETA estimado
 * - Minutos de atraso
 */
export class CreateTrackingHistoryView1734573600000 implements MigrationInterface {
  name = 'CreateTrackingHistoryView1734573600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar materialized view para histórico de rastreamento
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW tracking_history AS
      WITH latest_events AS (
        SELECT DISTINCT ON (delivery_id)
          delivery_id,
          event_id,
          event_type,
          event_status,
          timestamp,
          location,
          location_address,
          driver_id,
          route_id,
          speed,
          battery_level,
          accuracy
        FROM tracking_events
        WHERE deleted_at IS NULL
        ORDER BY delivery_id, timestamp DESC
      ),
      event_counts AS (
        SELECT 
          delivery_id,
          COUNT(*) as total_events,
          COUNT(CASE WHEN event_status = 'ERROR' THEN 1 END) as error_events,
          COUNT(CASE WHEN event_status = 'WARNING' THEN 1 END) as warning_events,
          MIN(timestamp) as first_event_time,
          MAX(timestamp) as last_event_time
        FROM tracking_events
        WHERE deleted_at IS NULL
        GROUP BY delivery_id
      ),
      distances AS (
        SELECT 
          delivery_id,
          SUM(distance_meters) / 1000 as total_distance_km
        FROM (
          SELECT 
            te.delivery_id,
            ST_Distance(
              te.location::geography,
              LAG(te.location) OVER (PARTITION BY te.delivery_id ORDER BY te.timestamp)::geography
            ) as distance_meters
          FROM tracking_events te
          WHERE te.location IS NOT NULL 
            AND te.deleted_at IS NULL
        ) distances_calc
        WHERE distance_meters IS NOT NULL
        GROUP BY delivery_id
      )
      SELECT 
        le.delivery_id,
        le.event_id as last_event_id,
        le.event_type as current_status,
        le.event_status as current_event_status,
        le.timestamp as last_update,
        le.location as last_location,
        ST_Y(le.location::geometry) as last_latitude,
        ST_X(le.location::geometry) as last_longitude,
        le.location_address as last_address,
        le.driver_id,
        le.route_id,
        le.speed as current_speed,
        le.battery_level as current_battery_level,
        le.accuracy as location_accuracy,
        ec.total_events,
        ec.error_events,
        ec.warning_events,
        ec.first_event_time,
        ec.last_event_time,
        EXTRACT(EPOCH FROM (ec.last_event_time - ec.first_event_time)) / 60 as total_duration_minutes,
        d.total_distance_km,
        NOW() as materialized_at
      FROM latest_events le
      LEFT JOIN event_counts ec ON ec.delivery_id = le.delivery_id
      LEFT JOIN distances d ON d.delivery_id = le.delivery_id
    `);

    // Criar índices para melhor performance
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_tracking_history_delivery_id 
      ON tracking_history (delivery_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_tracking_history_current_status 
      ON tracking_history (current_status)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_tracking_history_driver_id 
      ON tracking_history (driver_id) 
      WHERE driver_id IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX idx_tracking_history_route_id 
      ON tracking_history (route_id) 
      WHERE route_id IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX idx_tracking_history_last_update 
      ON tracking_history (last_update)
    `);

    // Criar índice espacial para consultas geográficas
    await queryRunner.query(`
      CREATE INDEX idx_tracking_history_last_location 
      ON tracking_history 
      USING GIST (last_location) 
      WHERE last_location IS NOT NULL
    `);

    // Criar função para refresh automático da view
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION refresh_tracking_history()
      RETURNS TRIGGER AS $$
      BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY tracking_history;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Criar trigger para refresh após insert/update em tracking_events
    await queryRunner.query(`
      CREATE TRIGGER trigger_refresh_tracking_history
      AFTER INSERT OR UPDATE OR DELETE ON tracking_events
      FOR EACH STATEMENT
      EXECUTE FUNCTION refresh_tracking_history();
    `);

    // Comentários na view
    await queryRunner.query(`
      COMMENT ON MATERIALIZED VIEW tracking_history IS 
      'View materializada com histórico agregado de rastreamento para consultas rápidas. 
      Atualizada automaticamente via trigger após mudanças em tracking_events.'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN tracking_history.delivery_id IS 
      'ID único da entrega'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN tracking_history.current_status IS 
      'Status atual da entrega baseado no último evento'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN tracking_history.last_update IS 
      'Data e hora da última atualização de rastreamento'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN tracking_history.total_distance_km IS 
      'Distância total percorrida em quilômetros'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN tracking_history.total_duration_minutes IS 
      'Duração total desde primeiro evento até último (em minutos)'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN tracking_history.materialized_at IS 
      'Timestamp de quando a view foi materializada'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover trigger
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trigger_refresh_tracking_history ON tracking_events
    `);

    // Remover função
    await queryRunner.query(`
      DROP FUNCTION IF EXISTS refresh_tracking_history()
    `);

    // Remover índices (serão removidos automaticamente com a view)

    // Remover materialized view
    await queryRunner.query(`
      DROP MATERIALIZED VIEW IF EXISTS tracking_history
    `);
  }
}
