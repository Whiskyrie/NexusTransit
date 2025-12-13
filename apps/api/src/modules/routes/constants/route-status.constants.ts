/**
 * Route Status Constants
 *
 * Constantes relacionadas a status e transições de rotas.
 *
 * @module Routes/Constants
 */

import { RouteStatus } from '../enums/route-status';

/**
 * Mapa de transições válidas de status
 *
 * Define quais transições são permitidas para cada status atual.
 * Uma rota só pode mudar de status seguindo essas regras.
 *
 * Regras de negócio:
 * - PLANNED: Pode ir para IN_PROGRESS ou ser CANCELLED
 * - IN_PROGRESS: Pode ser pausada (PAUSED), completada (COMPLETED) ou cancelada (CANCELLED)
 * - PAUSED: Pode retornar para IN_PROGRESS ou ser CANCELLED
 * - COMPLETED: Estado final, não permite transições
 * - CANCELLED: Estado final, não permite transições
 *
 * @constant
 */
export const VALID_STATUS_TRANSITIONS: Record<RouteStatus, RouteStatus[]> = {
  [RouteStatus.PLANNED]: [RouteStatus.IN_PROGRESS, RouteStatus.CANCELLED],

  [RouteStatus.IN_PROGRESS]: [RouteStatus.PAUSED, RouteStatus.COMPLETED, RouteStatus.CANCELLED],

  [RouteStatus.PAUSED]: [RouteStatus.IN_PROGRESS, RouteStatus.CANCELLED],

  [RouteStatus.COMPLETED]: [],

  [RouteStatus.CANCELLED]: [],
};

/**
 * Status que indicam que a rota está ativa (em execução ou pausada)
 *
 * @constant
 */
export const ACTIVE_ROUTE_STATUSES: RouteStatus[] = [RouteStatus.IN_PROGRESS, RouteStatus.PAUSED];

/**
 * Status que indicam que a rota foi finalizada (concluída ou cancelada)
 *
 * @constant
 */
export const FINAL_ROUTE_STATUSES: RouteStatus[] = [RouteStatus.COMPLETED, RouteStatus.CANCELLED];

/**
 * Status que permitem edição de dados da rota
 *
 * @constant
 */
export const EDITABLE_ROUTE_STATUSES: RouteStatus[] = [RouteStatus.PLANNED, RouteStatus.PAUSED];
