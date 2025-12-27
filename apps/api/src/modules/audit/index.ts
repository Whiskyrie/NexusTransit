/**
 * Módulo de Auditoria da API
 *
 * Re-exporta componentes do módulo para facilitar imports.
 */

// Controllers
export { AuditController } from './audit.controller';
export { AuditDashboardController } from './controllers/audit-dashboard.controller';

// Services
export { AuditDashboardService } from './services/audit-dashboard.service';

// DTOs
export * from './dto/audit-dashboard.dto';

// Interceptors
export { AuditRequestInterceptor } from './interceptors/audit-request.interceptor';

// Constants
export * from './constants/audit.constants';

// Module
export { AuditModule } from './audit.module';
