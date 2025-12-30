/**
 * Módulo de Auditoria da API
 *
 * Re-exporta componentes do módulo para facilitar imports.
 */

// Controllers
export { AuditController } from './audit.controller';
export { AuditDashboardController } from './controllers/audit-dashboard.controller';
export { AuditExportController } from './controllers/audit-export.controller';

// Services
export { AuditDashboardService } from './services/audit-dashboard.service';
export { AuditExportAsyncService } from './services/audit-export-async.service';

// DTOs
export * from './dto/audit-dashboard.dto';
export * from './dto/audit-export.dto';

// Interceptors
export { AuditRequestInterceptor } from './interceptors/audit-request.interceptor';

// Guards
export { AuditAccessGuard } from './guards/audit-access.guard';
export { AuditOwnerGuard, getAuditFilter } from './guards/audit-owner.guard';

// Decorators
export * from './decorators/audit-access.decorator';

// Enums
export * from './enums/audit-permission.enum';

// Constants
export * from './constants/audit.constants';

// Module
export { AuditModule } from './audit.module';
