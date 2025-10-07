import { SetMetadata } from '@nestjs/common';
import { TRACK_ACTIVITY_KEY } from '../constants/driver.constants';

/**
 * Tipo de atividades de motorista que podem ser rastreadas
 */
export enum DriverActivityType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  START_ROUTE = 'start_route',
  END_ROUTE = 'end_route',
  DELIVERY_ATTEMPT = 'delivery_attempt',
  STATUS_CHANGE = 'status_change',
  DOCUMENT_UPLOAD = 'document_upload',
}

/**
 * Interface para opções de rastreamento de atividade
 */
export interface TrackActivityOptions {
  /** Tipo de atividade a ser rastreada */
  activityType?: DriverActivityType;
  /** Se deve incluir detalhes da requisição */
  includeRequestDetails?: boolean;
  /** Se deve incluir detalhes do motorista */
  includeDriverDetails?: boolean;
  /** Campos adicionais a serem salvos */
  additionalFields?: string[];
  /** Se deve criar notificação */
  notify?: boolean;
}

/**
 * Opções padrão para rastreamento de atividade
 */
export const DEFAULT_TRACK_ACTIVITY_OPTIONS: TrackActivityOptions = {
  includeRequestDetails: true,
  includeDriverDetails: true,
  additionalFields: [],
  notify: false,
};

/**
 * Decorador para rastrear atividades do motorista
 *
 * Registra automaticamente atividades importantes do motorista
 * como login, início de rota, tentativas de entrega, etc.
 *
 * @param options - Opções de configuração do rastreamento
 *
 * @example
 * ```typescript
 * class DriversService {
 *   @TrackDriverActivity({
 *     activityType: DriverActivityType.START_ROUTE,
 *     includeRequestDetails: true,
 *     notify: true
 *   })
 *   async startRoute(driverId: string, routeId: string) {
 *     // Atividade será rastreada automaticamente
 *   }
 * }
 * ```
 */
export const TrackDriverActivity = (options: TrackActivityOptions = {}): MethodDecorator => {
  const mergedOptions = { ...DEFAULT_TRACK_ACTIVITY_OPTIONS, ...options };
  return SetMetadata(TRACK_ACTIVITY_KEY, mergedOptions);
};

/**
 * Decorador específico para rastrear login/logout
 *
 * @example
 * ```typescript
 * class AuthService {
 *   @TrackDriverLogin()
 *   async driverLogin(cpf: string, password: string) {
 *     // Login será rastreado
 *   }
 * }
 * ```
 */
export const TrackDriverLogin = (): MethodDecorator => {
  return SetMetadata(TRACK_ACTIVITY_KEY, {
    activityType: DriverActivityType.LOGIN,
    includeRequestDetails: true,
    includeDriverDetails: true,
    additionalFields: [],
    notify: false,
  });
};

/**
 * Decorador específico para rastrear mudanças de status
 *
 * @example
 * ```typescript
 * class DriversService {
 *   @TrackDriverStatusChange()
 *   async updateStatus(driverId: string, newStatus: DriverStatus) {
 *     // Mudança de status será rastreada
 *   }
 * }
 * ```
 */
export const TrackDriverStatusChange = (): MethodDecorator => {
  return SetMetadata(TRACK_ACTIVITY_KEY, {
    activityType: DriverActivityType.STATUS_CHANGE,
    includeRequestDetails: true,
    includeDriverDetails: true,
    additionalFields: ['old_status', 'new_status'],
    notify: true,
  });
};

/**
 * Decorador para rastrear tentativas de entrega
 *
 * @example
 * ```typescript
 * class DeliveriesService {
 *   @TrackDeliveryAttempt()
 *   async attemptDelivery(driverId: string, deliveryId: string) {
 *     // Tentativa será rastreada
 *   }
 * }
 * ```
 */
export const TrackDeliveryAttempt = (): MethodDecorator => {
  return SetMetadata(TRACK_ACTIVITY_KEY, {
    activityType: DriverActivityType.DELIVERY_ATTEMPT,
    includeRequestDetails: true,
    includeDriverDetails: true,
    additionalFields: ['delivery_id', 'attempt_result'],
    notify: false,
  });
};
