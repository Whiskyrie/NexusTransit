/**
 * Interface para os dados da view materializada tracking_history
 *
 * Representa os dados agregados de rastreamento otimizados para consultas
 */
export interface TrackingHistoryData {
  /**
   * ID da entrega
   */
  delivery_id: string;

  /**
   * ID do último evento registrado
   */
  last_event_id: string;

  /**
   * Status atual da entrega
   */
  current_status: string;

  /**
   * Status do último evento
   */
  current_event_status: string;

  /**
   * Data/hora da última atualização
   */
  last_update: Date;

  /**
   * Última localização (Point PostGIS)
   */
  last_location: string | null;

  /**
   * Última latitude registrada
   */
  last_latitude: number | null;

  /**
   * Última longitude registrada
   */
  last_longitude: number | null;

  /**
   * Último endereço registrado
   */
  last_address: string | null;

  /**
   * ID do motorista responsável
   */
  driver_id: string | null;

  /**
   * ID da rota associada
   */
  route_id: string | null;

  /**
   * Velocidade atual em km/h
   */
  current_speed: number | null;

  /**
   * Nível de bateria do dispositivo (0-100)
   */
  current_battery_level: number | null;

  /**
   * Precisão da localização em metros
   */
  location_accuracy: number | null;

  /**
   * Total de eventos registrados
   */
  total_events: number;

  /**
   * Total de eventos com erro
   */
  error_events: number;

  /**
   * Total de eventos com aviso
   */
  warning_events: number;

  /**
   * Data/hora do primeiro evento
   */
  first_event_time: Date;

  /**
   * Data/hora do último evento
   */
  last_event_time: Date;

  /**
   * Duração total em minutos
   */
  total_duration_minutes: number;

  /**
   * Distância total percorrida em km
   */
  total_distance_km: number | null;

  /**
   * Data/hora da materialização da view
   */
  materialized_at: Date;
}

/**
 * Interface para estatísticas agregadas
 */
export interface TrackingStatistics {
  /**
   * Total de entregas
   */
  total_deliveries: number;

  /**
   * Entregas ativas
   */
  active_deliveries: number;

  /**
   * Entregas com erros
   */
  deliveries_with_errors: number;

  /**
   * Entregas com avisos
   */
  deliveries_with_warnings: number;

  /**
   * Média de eventos por entrega
   */
  avg_events_per_delivery: number;

  /**
   * Distância média em km
   */
  avg_distance_km: number;
}
