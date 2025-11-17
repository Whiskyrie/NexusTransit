import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardSnapshot } from './entities/dashboard-snapshot.entity';
import { Delivery } from '../deliveries/entities/delivery.entity';
import { Driver } from '../drivers/entities/driver.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { Route } from '../routes/entities/route.entity';

/**
 * Dashboard Module
 * 
 * Módulo responsável por métricas, KPIs e análises do sistema
 * 
 * Features:
 * - Overview completo do dashboard
 * - Análise de tendências temporais
 * - Distribuições por categoria
 * - Rankings de performance
 * - KPIs específicos por módulo
 * - Cache de métricas via snapshots
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      DashboardSnapshot,
      Delivery,
      Driver,
      Vehicle,
      Route,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
