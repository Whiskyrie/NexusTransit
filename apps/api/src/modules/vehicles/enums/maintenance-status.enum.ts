/**
 * MaintenanceStatus Enum - Status da manutenção
 *
 * Define os possíveis status de uma manutenção durante seu ciclo de vida
 */
export enum MaintenanceStatus {
  /**
   * Agendada - Manutenção agendada mas ainda não iniciada
   */
  SCHEDULED = 'scheduled',

  /**
   * Em andamento - Manutenção em execução
   */
  IN_PROGRESS = 'in_progress',

  /**
   * Concluída - Manutenção finalizada
   */
  COMPLETED = 'completed',

  /**
   * Cancelada - Manutenção cancelada
   */
  CANCELLED = 'cancelled',
}
