-- Script para recriar a view materializada tracking_history
-- Execute com: psql -U nexus_user -d nexus_transit -f scripts/recreate-tracking-history-view.sql

-- Dropar view e objetos relacionados se existirem
DROP TRIGGER IF EXISTS trigger_refresh_tracking_history ON tracking_events;
DROP FUNCTION IF EXISTS refresh_tracking_history();
DROP MATERIALIZED VIEW IF EXISTS tracking_history CASCADE;

-- Criar materialized view para histórico de rastreamento
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
LEFT JOIN distances d ON d.delivery_id = le.delivery_id;

-- Criar índice único (necessário para REFRESH CONCURRENTLY)
CREATE UNIQUE INDEX idx_tracking_history_delivery_id 
ON tracking_history (delivery_id);

-- Criar índices para melhor performance
CREATE INDEX idx_tracking_history_current_status 
ON tracking_history (current_status);

CREATE INDEX idx_tracking_history_driver_id 
ON tracking_history (driver_id) 
WHERE driver_id IS NOT NULL;

CREATE INDEX idx_tracking_history_route_id 
ON tracking_history (route_id) 
WHERE route_id IS NOT NULL;

CREATE INDEX idx_tracking_history_last_update 
ON tracking_history (last_update);

-- Criar índice espacial para consultas geográficas
CREATE INDEX idx_tracking_history_last_location 
ON tracking_history 
USING GIST (last_location) 
WHERE last_location IS NOT NULL;

-- Comentário na view
COMMENT ON MATERIALIZED VIEW tracking_history IS 
'View materializada com histórico agregado de rastreamento para consultas rápidas.';

SELECT 'View materializada tracking_history criada com sucesso!' as resultado;
