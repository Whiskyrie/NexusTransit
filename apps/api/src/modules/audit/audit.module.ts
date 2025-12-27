import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule as AuditPackageModule, AuditLogEntity } from '@nexus/audit';
import { AuditController } from './audit.controller';
import { AuditDashboardController } from './controllers/audit-dashboard.controller';
import { AuditDashboardService } from './services/audit-dashboard.service';
import { AuditRequestInterceptor } from './interceptors/audit-request.interceptor';

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
 * - Endpoints REST documentados com Swagger
 */
@Module({
  imports: [AuditPackageModule, TypeOrmModule.forFeature([AuditLogEntity])],
  controllers: [AuditController, AuditDashboardController],
  providers: [AuditDashboardService, AuditRequestInterceptor],
  exports: [AuditDashboardService],
})
export class AuditModule {}
