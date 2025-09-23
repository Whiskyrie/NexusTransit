import { SetMetadata } from '@nestjs/common';
import { AUDITABLE_ENTITY_KEY, DEFAULT_AUDITABLE_OPTIONS } from '../constants/auditable.constants';
import type { AuditableOptions } from '../interfaces/auditable.interface';

/**
 * Decorador para marcar uma entidade como auditável
 *
 * @param options - Opções de configuração da auditoria
 */
export const Auditable = (options: AuditableOptions = {}): ClassDecorator => {
  const mergedOptions = { ...DEFAULT_AUDITABLE_OPTIONS, ...options };
  return SetMetadata(AUDITABLE_ENTITY_KEY, mergedOptions);
};

/**
 * Decorador específico para desabilitar auditoria temporariamente
 */
export const NonAuditable = (): ClassDecorator =>
  SetMetadata(AUDITABLE_ENTITY_KEY, {
    trackCreation: false,
    trackUpdates: false,
    trackDeletion: false,
  });

/**
 * Decorador para auditar apenas operações específicas
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
