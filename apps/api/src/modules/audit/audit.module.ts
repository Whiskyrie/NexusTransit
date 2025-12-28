import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule as AuditPackageModule, AuditLogEntity } from '@nexus/audit';
import { AuditController } from './audit.controller';
import { AuditDashboardController } from './controllers/audit-dashboard.controller';
import { AuditExportController } from './controllers/audit-export.controller';
import { AuditDashboardService } from './services/audit-dashboard.service';
import { AuditExportAsyncService } from './services/audit-export-async.service';
import { AuditRequestInterceptor } from './interceptors/audit-request.interceptor';
import { AuditAccessGuard } from './guards/audit-access.guard';
import { AuditOwnerGuard } from './guards/audit-owner.guard';

/**
 * Módulo de Auditoria da API
 *
 * Fornece endpoints REST para consulta, exportação e visualização
 * de logs de auditoria do sistema NexusTransit.
 *
 * Este módulo complementa o package @nexus/audit com:
 * - Dashboard de estatísticas e análises
 * - Detecção de alertas de segurança
 * - Meta-auditoria (auditoria do acesso aos logs)
 * - Exportação assíncrona (CSV, JSON, XLSX)
 * - Endpoints REST documentados com Swagger
 * - Guards de autorização baseados em permissões
 */
@Module({
  imports: [AuditPackageModule, TypeOrmModule.forFeature([AuditLogEntity])],
  controllers: [AuditController, AuditDashboardController, AuditExportController],
  providers: [
    AuditDashboardService,
    AuditExportAsyncService,
    AuditRequestInterceptor,
    AuditAccessGuard,
    AuditOwnerGuard,
  ],
  exports: [AuditDashboardService, AuditExportAsyncService, AuditAccessGuard, AuditOwnerGuard],
})
export class AuditModule {}
