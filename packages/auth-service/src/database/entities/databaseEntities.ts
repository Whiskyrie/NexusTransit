/**
 * Database Entities Index
 * 
 * Central export point for all TypeORM entities in auth-service.
 * Includes base entities and domain-specific entities.
 */

// Base entity
export { BaseEntity } from './base.entity';

// Auth domain entities
export { User } from '../../users/entities/user.entity';
export { Role } from '../../roles/entities/role.entity';
export { Permission } from '../../auth/entities/permission.entity';

// Note: AuditLogEntity is not part of auth-service.
// Audit events are logged via AuditLogService which will forward to audit-service.
