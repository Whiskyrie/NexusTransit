import { SetMetadata } from '@nestjs/common';

/**
 * Chave para metadados de entidades auditáveis
 */
export const AUDITABLE_ENTITY_KEY = 'auditable_delivery_entity';

/**
 * Interface para opções de auditoria
 */
export interface AuditableOptions {
  /** Se deve registrar operações CREATE */
  trackCreation?: boolean;
  /** Se deve registrar operações UPDATE */
  trackUpdates?: boolean;
  /** Se deve registrar operações DELETE */
  trackDeletion?: boolean;
  /** Campos que devem ser ignorados na auditoria */
  excludeFields?: string[];
  /** Se deve registrar valores antigos em updates */
  trackOldValues?: boolean;
  /** Nome personalizado para a entidade nos logs */
  entityDisplayName?: string;
}

/**
 * Opções padrão para auditoria
 */
export const DEFAULT_AUDITABLE_OPTIONS: AuditableOptions = {
  trackCreation: true,
  trackUpdates: true,
  trackDeletion: true,
  excludeFields: ['updated_at', 'created_at'],
  trackOldValues: true,
  entityDisplayName: '',
};

/**
 * Decorator para marcar uma entidade de entrega como auditável
 *
 * Habilita rastreamento automático de operações CRUD através de subscribers
 *
 * @param options - Opções de configuração da auditoria
 *
 * @example
 * ```typescript
 * @Entity('deliveries')
 * @Auditable({
 *   trackCreation: true,
 *   trackUpdates: true,
 *   excludeFields: ['updated_at']
 * })
 * export class Delivery extends BaseEntity {
 *   // ...
 * }
 * ```
 */
export const Auditable = (options: AuditableOptions = {}): ClassDecorator => {
  const mergedOptions = { ...DEFAULT_AUDITABLE_OPTIONS, ...options };
  return SetMetadata(AUDITABLE_ENTITY_KEY, mergedOptions);
};

/**
 * Decorator específico para desabilitar auditoria temporariamente
 *
 * @example
 * ```typescript
 * @Entity('temp_deliveries')
 * @NonAuditable()
 * export class TempDelivery {
 *   // Não será auditada
 * }
 * ```
 */
export const NonAuditable = (): ClassDecorator =>
  SetMetadata(AUDITABLE_ENTITY_KEY, {
    trackCreation: false,
    trackUpdates: false,
    trackDeletion: false,
  });

/**
 * Decorator para auditar apenas operações específicas
 *
 * @param operations - Array de operações a serem auditadas
 *
 * @example
 * ```typescript
 * @Entity('deliveries')
 * @AuditableOperations(['CREATE', 'UPDATE'])
 * export class Delivery {
 *   // Apenas criação e atualização serão auditadas
 * }
 * ```
 */
export const AuditableOperations = (
  operations: ('CREATE' | 'UPDATE' | 'DELETE')[],
): ClassDecorator => {
  return SetMetadata(AUDITABLE_ENTITY_KEY, {
    trackCreation: operations.includes('CREATE'),
    trackUpdates: operations.includes('UPDATE'),
    trackDeletion: operations.includes('DELETE'),
    excludeFields: ['updated_at', 'created_at'],
    trackOldValues: true,
    entityDisplayName: '',
  });
};
