/**
 * Auditable Decorator for Routes Module
 *
 * Implementação customizada do decorator @Auditable para o módulo Routes
 * com configurações específicas para entidades de rota
 *
 * @module Routes/Decorators
 */

import { SetMetadata } from '@nestjs/common';

/**
 * Chave de metadados para entidades auditáveis do módulo Routes
 */
export const ROUTES_AUDITABLE_ENTITY_KEY = 'ROUTES_AUDITABLE_ENTITY';

/**
 * Interface para opções de auditoria customizadas do módulo Routes
 */
export interface RoutesAuditableOptions {
  /** Habilita rastreamento de criação */
  trackCreation?: boolean;

  /** Habilita rastreamento de atualizações */
  trackUpdates?: boolean;

  /** Habilita rastreamento de exclusão */
  trackDeletion?: boolean;

  /** Campos a serem excluídos da auditoria */
  excludeFields?: string[];

  /** Habilita rastreamento de valores antigos */
  trackOldValues?: boolean;

  /** Nome de exibição da entidade para logs */
  entityDisplayName?: string;

  /** Habilita rastreamento de mudanças de status */
  trackStatusChanges?: boolean;

  /** Habilita rastreamento de mudanças geográficas */
  trackGeographicChanges?: boolean;

  /** Campos sensíveis que nunca devem ser auditados */
  sensitiveFields?: string[];
}

/**
 * Opções padrão para auditoria no módulo Routes
 */
export const DEFAULT_ROUTES_AUDITABLE_OPTIONS: RoutesAuditableOptions = {
  trackCreation: true,
  trackUpdates: true,
  trackDeletion: true,
  excludeFields: ['updated_at', 'created_at'],
  trackOldValues: true,
  entityDisplayName: 'Rota',
  trackStatusChanges: true,
  trackGeographicChanges: true,
  sensitiveFields: ['driver_license_number', 'vehicle_vin'],
};

/**
 * Decorator para marcar entidades do módulo Routes como auditáveis
 *
 * Aplica configurações específicas para auditoria de entidades de rota,
 * incluindo rastreamento de mudanças geográficas e de status
 *
 * @param options - Opções de configuração da auditoria
 *
 * @example
 * ```typescript
 * @Entity('routes')
 * @RoutesAuditable({
 *   trackCreation: true,
 *   trackUpdates: true,
 *   trackDeletion: true,
 *   excludeFields: ['updated_at', 'created_at', 'internal_notes'],
 *   entityDisplayName: 'Rota de Entrega',
 *   trackStatusChanges: true,
 *   trackGeographicChanges: true,
 *   sensitiveFields: ['driver_cpf']
 * })
 * export class Route extends BaseEntity {
 *   // Todas as operações serão auditadas com configurações customizadas
 * }
 * ```
 */
export const RoutesAuditable = (options: RoutesAuditableOptions = {}): ClassDecorator => {
  const mergedOptions = { ...DEFAULT_ROUTES_AUDITABLE_OPTIONS, ...options };
  return SetMetadata(ROUTES_AUDITABLE_ENTITY_KEY, mergedOptions);
};

/**
 * Decorator para desabilitar auditoria em entidades do módulo Routes
 *
 * @example
 * ```typescript
 * @Entity('temp_routes')
 * @RoutesNonAuditable()
 * export class TempRoute {
 *   // Operações não serão auditadas
 * }
 * ```
 */
export const RoutesNonAuditable = (): ClassDecorator =>
  SetMetadata(ROUTES_AUDITABLE_ENTITY_KEY, {
    trackCreation: false,
    trackUpdates: false,
    trackDeletion: false,
  });

/**
 * Decorator para auditar apenas operações específicas em entidades do módulo Routes
 *
 * @param operations - Array de operações a serem auditadas
 *
 * @example
 * ```typescript
 * @Entity('route_logs')
 * @RoutesAuditableOperations(['CREATE', 'UPDATE'])
 * export class RouteLog {
 *   // Apenas CREATE e UPDATE serão auditados
 * }
 * ```
 */
export const RoutesAuditableOperations = (
  operations: ('CREATE' | 'UPDATE' | 'DELETE')[],
): ClassDecorator => {
  return SetMetadata(ROUTES_AUDITABLE_ENTITY_KEY, {
    trackCreation: operations.includes('CREATE'),
    trackUpdates: operations.includes('UPDATE'),
    trackDeletion: operations.includes('DELETE'),
    excludeFields: ['updated_at', 'created_at'],
    trackOldValues: true,
    entityDisplayName: '',
    trackStatusChanges: false,
    trackGeographicChanges: false,
    sensitiveFields: [],
  });
};

/**
 * Decorator específico para entidades de rota que rastreiam mudanças geográficas
 *
 * Aplica configurações otimizadas para entidades que possuem coordenadas
 * e endereços que precisam ser monitorados
 *
 * @param options - Opções adicionais de configuração
 *
 * @example
 * ```typescript
 * @Entity('route_stops')
 * @RoutesGeographicAuditable({
 *   entityDisplayName: 'Parada de Rota',
 *   excludeFields: ['internal_coordinates', 'geocoding_data']
 * })
 * export class RouteStop extends BaseEntity {
 *   // Auditoria focada em mudanças geográficas
 * }
 * ```
 */
export const RoutesGeographicAuditable = (
  options: Omit<RoutesAuditableOptions, 'trackGeographicChanges'> = {},
): ClassDecorator => {
  const mergedOptions = {
    ...DEFAULT_ROUTES_AUDITABLE_OPTIONS,
    ...options,
    trackGeographicChanges: true,
  };
  return SetMetadata(ROUTES_AUDITABLE_ENTITY_KEY, mergedOptions);
};

/**
 * Decorator específico para entidades que rastreiam mudanças de status
 *
 * Aplica configurações otimizadas para entidades onde o status
 * é uma informação crítica de negócio
 *
 * @param options - Opções adicionais de configuração
 *
 * @example
 * ```typescript
 * @Entity('routes')
 * @RoutesStatusAuditable({
 *   entityDisplayName: 'Status da Rota',
 *   trackOldValues: true
 * })
 * export class Route extends BaseEntity {
 *   // Auditoria focada em mudanças de status
 * }
 * ```
 */
export const RoutesStatusAuditable = (
  options: Omit<RoutesAuditableOptions, 'trackStatusChanges'> = {},
): ClassDecorator => {
  const mergedOptions = {
    ...DEFAULT_ROUTES_AUDITABLE_OPTIONS,
    ...options,
    trackStatusChanges: true,
  };
  return SetMetadata(ROUTES_AUDITABLE_ENTITY_KEY, mergedOptions);
};

export { RoutesAuditable as Auditable };
