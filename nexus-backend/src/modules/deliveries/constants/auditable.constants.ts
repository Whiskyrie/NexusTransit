/**
 * Chave usada para metadados de entidades auditáveis
 */
export const AUDITABLE_ENTITY_KEY = 'auditable_entity';

/**
 * Chave para metadados de rastreamento de status
 */
export const TRACK_STATUS_KEY = 'track_status';

/**
 * Chave para metadados de validação de transição
 */
export const VALIDATE_TRANSITION_KEY = 'validate_transition';

/**
 * Opções padrão para auditoria
 */
export const DEFAULT_AUDITABLE_OPTIONS = {
  trackCreation: true,
  trackUpdates: true,
  trackDeletion: true,
  excludeFields: ['updated_at', 'created_at'],
  trackOldValues: true,
  entityDisplayName: '',
} as const;
