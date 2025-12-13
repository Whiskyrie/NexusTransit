import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';
import { randomUUID } from 'crypto';
import type { Request } from 'express';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { LoggingModule } from '@nexus/logger';
import { HealthModule } from './health/health.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { RoutesModule } from './modules/routes/routes.module';
import { DeliveriesModule } from './modules/deliveries/deliveries.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { CustomersModule } from './modules/customers/customers.module';
import { AuthModule } from './modules/auth/auth.module';
import { RedisModule } from '@nexus/redis';
import { AuditModule } from '@nexus/audit';
import { ComplianceModule } from '@nexus/compliance';
import { ReportingModule } from '@nexus/reporting';
import { RateLimitModule } from '@nexus/rate-limit';
import { StorageModule } from '@nexus/storage';
import { ServiceOrdersModule } from './modules/service-orders/service-orders.module';
import configurations from './config/configurations';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: configurations,
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
      cache: true,
    }),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: (req: Request) => {
          const requestId = req.headers['x-request-id'];
          return typeof requestId === 'string' ? requestId : randomUUID();
        },
      },
    }),
    DatabaseModule, // Configuração TypeORM + PostgreSQL
    LoggingModule, // Logging estruturado com Pino + Métricas
    HealthModule, // Health checks e monitoramento
    UsersModule, // Sistema de usuários
    RolesModule, // Sistema de papéis e permissões
    VehiclesModule,
    DriversModule,
    RoutesModule,
    DeliveriesModule,
    TrackingModule,
    IncidentsModule,
    CustomersModule,
    AuthModule,
    RedisModule.forRootAsync(),
    AuditModule, // Sistema de auditoria e logs
    ComplianceModule, // Conformidade LGPD/GDPR
    ReportingModule, // Sistema de relatórios
    RateLimitModule, // Sistema de rate limiting e throttling
    StorageModule.forRoot(), // Upload de arquivos
    ServiceOrdersModule, // Sistema de ordens de serviço
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
