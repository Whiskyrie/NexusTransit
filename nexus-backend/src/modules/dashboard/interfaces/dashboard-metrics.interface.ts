/**
 * Interface para métricas agregadas do dashboard
 */
export interface DashboardMetrics {
  /**
   * Métricas de entregas
   */
  deliveries: DeliveryMetrics;

  /**
   * Métricas de motoristas
   */
  drivers: DriverMetrics;

  /**
   * Métricas de veículos
   */
  vehicles: VehicleMetrics;

  /**
   * Métricas de rotas
   */
  routes: RouteMetrics;

  /**
   * Métricas financeiras
   */
  financial: FinancialMetrics;

  /**
   * Métricas de performance
   */
  performance: PerformanceMetrics;
}

/**
 * Métricas relacionadas a entregas
 */
export interface DeliveryMetrics {
  /**
   * Total de entregas no período
   */
  total: number;

  /**
   * Entregas concluídas com sucesso
   */
  completed: number;

  /**
   * Entregas pendentes
   */
  pending: number;

  /**
   * Entregas em andamento
   */
  in_progress: number;

  /**
   * Entregas canceladas
   */
  cancelled: number;

  /**
   * Entregas com falha
   */
  failed: number;

  /**
   * Taxa de sucesso (%)
   */
  success_rate: number;

  /**
   * Taxa de cancelamento (%)
   */
  cancellation_rate: number;

  /**
   * Tempo médio de entrega (minutos)
   */
  average_delivery_time: number;

  /**
   * Número de tentativas médio
   */
  average_attempts: number;

  /**
   * Entregas no prazo
   */
  on_time_deliveries: number;

  /**
   * Entregas atrasadas
   */
  delayed_deliveries: number;

  /**
   * Taxa de pontualidade (%)
   */
  on_time_rate: number;
}

/**
 * Métricas relacionadas a motoristas
 */
export interface DriverMetrics {
  /**
   * Total de motoristas ativos
   */
  total_active: number;

  /**
   * Motoristas disponíveis
   */
  available: number;

  /**
   * Motoristas em rota
   */
  on_route: number;

  /**
   * Motoristas em pausa
   */
  on_break: number;

  /**
   * Motoristas inativos
   */
  inactive: number;

  /**
   * Taxa de utilização (%)
   */
  utilization_rate: number;

  /**
   * Média de entregas por motorista
   */
  average_deliveries_per_driver: number;

  /**
   * Motorista com mais entregas
   */
  top_performer?: {
    driver_id: string;
    driver_name: string;
    deliveries_count: number;
  };
}

/**
 * Métricas relacionadas a veículos
 */
export interface VehicleMetrics {
  /**
   * Total de veículos
   */
  total: number;

  /**
   * Veículos ativos
   */
  active: number;

  /**
   * Veículos em manutenção
   */
  in_maintenance: number;

  /**
   * Veículos inativos
   */
  inactive: number;

  /**
   * Taxa de utilização da frota (%)
   */
  fleet_utilization_rate: number;

  /**
   * Distância total percorrida (km)
   */
  total_distance_km: number;

  /**
   * Média de km por veículo
   */
  average_distance_per_vehicle: number;

  /**
   * Veículos que precisam de manutenção
   */
  vehicles_needing_maintenance: number;
}

/**
 * Métricas relacionadas a rotas
 */
export interface RouteMetrics {
  /**
   * Total de rotas no período
   */
  total: number;

  /**
   * Rotas planejadas
   */
  planned: number;

  /**
   * Rotas em andamento
   */
  in_progress: number;

  /**
   * Rotas completadas
   */
  completed: number;

  /**
   * Rotas canceladas
   */
  cancelled: number;

  /**
   * Taxa de conclusão (%)
   */
  completion_rate: number;

  /**
   * Distância total planejada (km)
   */
  total_planned_distance_km: number;

  /**
   * Distância total percorrida (km)
   */
  total_actual_distance_km: number;

  /**
   * Eficiência de rota (%)
   */
  route_efficiency: number;
}

/**
 * Métricas financeiras
 */
export interface FinancialMetrics {
  /**
   * Receita total no período
   */
  total_revenue: number;

  /**
   * Custo total no período
   */
  total_cost: number;

  /**
   * Lucro bruto
   */
  gross_profit: number;

  /**
   * Margem de lucro (%)
   */
  profit_margin: number;

  /**
   * Receita média por entrega
   */
  average_revenue_per_delivery: number;

  /**
   * Custo médio por entrega
   */
  average_cost_per_delivery: number;

  /**
   * Custo estimado de combustível
   */
  estimated_fuel_cost: number;

  /**
   * Taxa média de entrega
   */
  average_delivery_fee: number;
}

/**
 * Métricas de performance
 */
export interface PerformanceMetrics {
  /**
   * Score de eficiência operacional (0-100)
   */
  operational_efficiency_score: number;

  /**
   * Score de qualidade de serviço (0-100)
   */
  service_quality_score: number;

  /**
   * Score de satisfação do cliente (0-100)
   */
  customer_satisfaction_score: number;

  /**
   * Tempo médio de resposta (minutos)
   */
  average_response_time: number;

  /**
   * Taxa de primeira tentativa bem-sucedida (%)
   */
  first_attempt_success_rate: number;

  /**
   * Produtividade (entregas por hora)
   */
  productivity_rate: number;
}

/**
 * Interface para dados de gráficos de tendência
 */
export interface TrendData {
  /**
   * Label do período (data, semana, mês, etc)
   */
  label: string;

  /**
   * Valor da métrica no período
   */
  value: number;

  /**
   * Data do período
   */
  date: Date;
}

/**
 * Interface para distribuição por categoria
 */
export interface CategoryDistribution {
  /**
   * Nome da categoria
   */
  category: string;

  /**
   * Quantidade
   */
  count: number;

  /**
   * Percentual do total
   */
  percentage: number;

  /**
   * Cor para exibição
   */
  color?: string;
}

/**
 * Interface para ranking de performance
 */
export interface PerformanceRanking {
  /**
   * ID da entidade
   */
  id: string;

  /**
   * Nome/Identificador
   */
  name: string;

  /**
   * Score ou métrica
   */
  score: number;

  /**
   * Posição no ranking
   */
  rank: number;

  /**
   * Dados adicionais
   */
  metadata?: Record<string, unknown>;
}
