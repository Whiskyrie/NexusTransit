/**
 * Status da rota
 *
 * Define os diferentes estados que uma rota pode ter durante seu ciclo de vida
 */
export enum RouteStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * Descrições dos status
 */
export const RouteStatusDescriptions: Record<RouteStatus, string> = {
  [RouteStatus.PLANNED]: 'Planejada',
  [RouteStatus.IN_PROGRESS]: 'Em Execução',
  [RouteStatus.PAUSED]: 'Pausada',
  [RouteStatus.COMPLETED]: 'Finalizada',
  [RouteStatus.CANCELLED]: 'Cancelada',
};

/**
 * Status finais (não permitem mais transições)
 */
export const FinalRouteStatuses = [RouteStatus.COMPLETED, RouteStatus.CANCELLED];

/**
 * Transições válidas de status
 */
export const RouteStatusTransitions: Record<RouteStatus, RouteStatus[]> = {
  [RouteStatus.PLANNED]: [RouteStatus.IN_PROGRESS, RouteStatus.CANCELLED],
  [RouteStatus.IN_PROGRESS]: [RouteStatus.PAUSED, RouteStatus.COMPLETED, RouteStatus.CANCELLED],
  [RouteStatus.PAUSED]: [RouteStatus.IN_PROGRESS, RouteStatus.CANCELLED],
  [RouteStatus.COMPLETED]: [], // Status final
  [RouteStatus.CANCELLED]: [], // Status final
};

/**
 * Valida se uma transição de status é permitida
 */
export function isValidStatusTransition(
  currentStatus: RouteStatus,
  newStatus: RouteStatus,
): boolean {
  const allowedTransitions = RouteStatusTransitions[currentStatus];
  return allowedTransitions.includes(newStatus);
}
