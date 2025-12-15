/**
 * Routes Module Interfaces
 *
 * Barrel export para todas as interfaces do módulo Routes
 * Interfaces genéricas foram movidas para @nexus/common
 *
 * @module Routes/Interfaces
 */

export * from './route-validation.interface';
export * from './route-metrics.interface';
export * from './route.interface';
export * from './optimization.interface';
export * from './metrics.interface';

// Re-export interfaces do @nexus/common para compatibilidade
export type {
  RequestUser,
  RequestWithUser,
  AuditContext,
  GeoPoint as CommonGeoPoint,
  Coordinates,
} from '@nexus/common';
