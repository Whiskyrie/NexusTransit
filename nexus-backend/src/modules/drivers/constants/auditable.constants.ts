/**
 * Chave usada para metadados de entidades auditáveis
 */
export const AUDITABLE_ENTITY_KEY = 'auditable_entity';

/**
 * Opções padrão para auditoria de motoristas
 */
export const DEFAULT_AUDITABLE_OPTIONS = {
  trackCreation: true,
  trackUpdates: true,
  trackDeletion: true,
  excludeFields: ['updated_at', 'created_at'],
  trackOldValues: true,
  entityDisplayName: '',
} as const;
