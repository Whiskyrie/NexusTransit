import { SetMetadata } from '@nestjs/common';
import type { AuditableOptions } from '../interfaces/auditable.interface';

/**
 * Chave para metadados de entidades auditáveis do Rate Limit
 */
export const AUDITABLE_ENTITY_KEY = 'auditable_rate_limit_entity';

/**
 * Opções padrão para auditoria de Rate Limit
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
 * Decorator para marcar uma entidade de rate limit como auditável
 *
 * Habilita rastreamento automático de operações CRUD através de subscribers
 * para entidades relacionadas a rate limiting, como regras e uso de quotas.
 *
 * @param options - Opções de configuração da auditoria
 *
 * @example
 * ```typescript
 * @Entity('rate_limit_rules')
 * @Auditable({
 *   trackCreation: true,
 *   trackUpdates: true,
 *   excludeFields: ['updated_at'],
 *   entityDisplayName: 'Rate Limit Rule'
 * })
 * export class RateLimitRule extends BaseEntity {
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
 * Útil para entidades temporárias ou de teste que não precisam
 * de rastreamento de auditoria.
 *
 * @example
 * ```typescript
 * @Entity('temp_rate_limits')
 * @NonAuditable()
 * export class TempRateLimit {
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
 * Permite controle granular sobre quais operações devem ser auditadas,
 * útil para otimizar performance em entidades com alto volume de operações.
 *
 * @param operations - Array de operações a serem auditadas
 *
 * @example
 * ```typescript
 * @Entity('quota_usage')
 * @AuditableOperations(['CREATE', 'DELETE'])
 * export class QuotaUsage {
 *   // Apenas criação e deleção serão auditadas
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
