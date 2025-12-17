/**
 * MaintenanceType Enum - Tipos de manutenção
 *
 * Define os diferentes tipos de manutenção que podem ser realizadas nos veículos
 */
export enum MaintenanceType {
  /**
   * Manutenção preventiva - Realizada periodicamente para evitar problemas
   */
  PREVENTIVE = 'preventive',

  /**
   * Manutenção corretiva - Realizada para corrigir problemas identificados
   */
  CORRECTIVE = 'corrective',

  /**
   * Revisão - Revisão periódica obrigatória
   */
  REVIEW = 'review',

  /**
   * Emergência - Manutenção de emergência para problemas críticos
   */
  EMERGENCY = 'emergency',

  /**
   * Inspeção - Inspeção técnica do veículo
   */
  INSPECTION = 'inspection',

  /**
   * Outros - Outros tipos de manutenção
   */
  OTHER = 'other',
}
