import { SetMetadata } from '@nestjs/common';

/**
 * Chave para metadados de rastreamento de status
 */
export const TRACK_STATUS_KEY = 'track_delivery_status';

/**
 * Interface para opções de rastreamento de status
 */
export interface TrackStatusOptions {
  /** Se deve criar registro no histórico */
  createHistory?: boolean;
  /** Se deve validar a transição */
  validateTransition?: boolean;
  /** Campos adicionais a serem salvos no histórico */
  additionalFields?: string[];
  /** Se deve notificar sobre a mudança */
  notify?: boolean;
}

/**
 * Opções padrão para rastreamento de status
 */
export const DEFAULT_TRACK_STATUS_OPTIONS: TrackStatusOptions = {
  createHistory: true,
  validateTransition: true,
  additionalFields: [],
  notify: false,
};

/**
 * Decorator para rastrear mudanças de status automaticamente
 *
 * Quando aplicado a uma classe ou método, registra automaticamente
 * mudanças de status no histórico (DeliveryStatusHistory)
 *
 * @param options - Opções de configuração do rastreamento
 *
 * @example
 * ```typescript
 * @Entity('deliveries')
 * @TrackStatus({
 *   createHistory: true,
 *   validateTransition: true,
 *   notify: true
 * })
 * export class Delivery {
 *   // Mudanças de status serão rastreadas automaticamente
 * }
 * ```
 */
export const TrackStatus = (options: TrackStatusOptions = {}): ClassDecorator & MethodDecorator => {
  const mergedOptions = { ...DEFAULT_TRACK_STATUS_OPTIONS, ...options };
  return SetMetadata(TRACK_STATUS_KEY, mergedOptions) as ClassDecorator & MethodDecorator;
};

/**
 * Decorator específico para rastreamento sem validação
 *
 * Útil para casos onde a validação é feita manualmente
 *
 * @example
 * ```typescript
 * class DeliveryService {
 *   @TrackStatusWithoutValidation()
 *   async forceUpdateStatus(id: string, status: DeliveryStatus) {
 *     // Status será rastreado mas não validado
 *   }
 * }
 * ```
 */
export const TrackStatusWithoutValidation = (): MethodDecorator => {
  return SetMetadata(TRACK_STATUS_KEY, {
    createHistory: true,
    validateTransition: false,
    additionalFields: [],
    notify: false,
  });
};

/**
 * Decorator para rastreamento silencioso (sem notificações)
 *
 * @example
 * ```typescript
 * class DeliveryService {
 *   @TrackStatusSilent()
 *   async updateStatusQuietly(id: string, status: DeliveryStatus) {
 *     // Status será rastreado mas não notificado
 *   }
 * }
 * ```
 */
export const TrackStatusSilent = (): MethodDecorator => {
  return SetMetadata(TRACK_STATUS_KEY, {
    createHistory: true,
    validateTransition: true,
    additionalFields: [],
    notify: false,
  });
};
