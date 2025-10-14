import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';
import { randomUUID } from 'crypto';
import type { Request } from 'express';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
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
import { ReportsModule } from './modules/reports/reports.module';
import { AuthModule } from './modules/auth/auth.module';
import { RedisModule } from './modules/redis/redis.module';
import { AuditModule } from './modules/audit/audit.module';
import { LgpdModule } from './modules/lgpd/lgpd.module';
import { UploadModule } from './modules/upload/upload.module';
import configurations from './config/configurations';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: configurations,
      isGlobal: true,
      envFilePath: '.env',
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
    ReportsModule,
    AuthModule,
    RedisModule,
    AuditModule, // Sistema de auditoria e logs
    LgpdModule,
    UploadModule, // Conformidade LGPD
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
