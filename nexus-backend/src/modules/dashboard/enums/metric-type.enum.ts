/**
 * Tipos de métricas para análise do dashboard
 * 
 * Permite categorizar diferentes tipos de indicadores
 */
export enum MetricType {
  /**
   * KPI - Key Performance Indicator
   */
  KPI = 'KPI',

  /**
   * Métrica de performance
   */
  PERFORMANCE = 'PERFORMANCE',

  /**
   * Métrica financeira
   */
  FINANCIAL = 'FINANCIAL',

  /**
   * Métrica operacional
   */
  OPERATIONAL = 'OPERATIONAL',

  /**
   * Métrica de qualidade
   */
  QUALITY = 'QUALITY',

  /**
   * Métrica de satisfação
   */
  SATISFACTION = 'SATISFACTION',
}
