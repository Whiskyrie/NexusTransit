/**
 * Barrel export para Utils do módulo Routes
 *
 * Centraliza exports para facilitar imports
 * Utils genéricos foram movidos para @nexus/common
 */

export * from './route.util';

// Re-export utils do @nexus/common para compatibilidade
export { ClsAuditUtils, AuditableUtils, DateTimeUtils } from '@nexus/common';
