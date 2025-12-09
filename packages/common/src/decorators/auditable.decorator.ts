import { SetMetadata } from "@nestjs/common";
import {
  AUDITABLE_ENTITY_KEY,
  DEFAULT_AUDITABLE_OPTIONS,
} from "../constants/auditable.constants";
import type { AuditableOptions } from "../interfaces/auditable.interface";

/**
 * Decorador para marcar uma entidade como auditável
 *
 * Habilita rastreamento automático de operações CRUD através de subscribers
 * TypeORM. Este decorator deve ser aplicado à classe da entidade.
 *
 * @param options - Opções de configuração da auditoria
 *
 * @example
 * ```typescript
 * @Entity('vehicles')
 * @Auditable({
 *   trackCreation: true,
 *   trackUpdates: true,
 *   trackDeletion: true,
 *   excludeFields: ['updated_at'],
 *   entityDisplayName: 'Veículo'
 * })
 * export class Vehicle extends BaseEntity {
 *   // ...
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
 * Útil para entidades temporárias ou de teste que não precisam
 * de rastreamento de auditoria.
 *
 * @example
 * ```typescript
 * @Entity('temp_data')
 * @NonAuditable()
 * export class TempData {
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
 * Decorador para auditar apenas operações específicas
 *
 * Permite controle granular sobre quais operações devem ser auditadas,
 * útil para otimizar performance em entidades com alto volume de operações.
 *
 * @param operations - Array de operações a serem auditadas
 *
 * @example
 * ```typescript
 * @Entity('tracking_events')
 * @AuditableOperations(['CREATE', 'DELETE'])
 * export class TrackingEvent {
 *   // Apenas criação e deleção serão auditadas
 * }
 * ```
 */
export const AuditableOperations = (
  operations: ("CREATE" | "UPDATE" | "DELETE")[]
): ClassDecorator => {
  return SetMetadata(AUDITABLE_ENTITY_KEY, {
    trackCreation: operations.includes("CREATE"),
    trackUpdates: operations.includes("UPDATE"),
    trackDeletion: operations.includes("DELETE"),
    excludeFields: ["updated_at", "created_at"],
    trackOldValues: true,
    entityDisplayName: "",
  });
};
