import { SetMetadata } from '@nestjs/common';
import { AUDITABLE_ENTITY_KEY, DEFAULT_AUDITABLE_OPTIONS } from '../constants/auditable.constants';
import type { AuditableOptions } from '../interfaces/auditable.interface';

/**
 * Decorador para marcar uma entidade como auditável
 *
 * Quando aplicado a uma entidade, registra automaticamente todas as
 * operações CRUD no sistema de auditoria
 *
 * @param options - Opções de configuração da auditoria
 *
 * @example
 * ```typescript
 * @Entity('customers')
 * @Auditable({
 *   trackCreation: true,
 *   trackUpdates: true,
 *   trackDeletion: true,
 *   excludeFields: ['taxId', 'email'],
 *   entityDisplayName: 'Cliente'
 * })
 * export class Customer extends BaseEntity {
 *   // Todas as operações serão auditadas
 * }
 * ```
 */
export const Auditable = (options: AuditableOptions = {}): ClassDecorator => {
  const mergedOptions = { ...DEFAULT_AUDITABLE_OPTIONS, ...options };
  return SetMetadata(AUDITABLE_ENTITY_KEY, mergedOptions);
};

/**
 * Decorador específico para desabilitar auditoria temporariamente
 *
 * @example
 * ```typescript
 * @Entity('temp_customers')
 * @NonAuditable()
 * export class TempCustomer {
 *   // Operações não serão auditadas
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
 * Decorador para auditar apenas operações específicas
 *
 * @param operations - Array de operações a serem auditadas
 *
 * @example
 * ```typescript
 * @Entity('customer_addresses')
 * @AuditableOperations(['CREATE', 'DELETE'])
 * export class CustomerAddress {
 *   // Apenas CREATE e DELETE serão auditados
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
