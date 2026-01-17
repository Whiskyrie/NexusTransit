import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { RoutesController } from './routes.controller';

// Services
import { RoutesService } from './routes.service';
import { RouteOptimizationService } from './services/route-optimization.service';
import { RouteValidationService } from './services/route-validation.service';
import { RouteMetricsService } from './services/route-metrics.service';

// Validators
import { RouteValidatorService } from './validators/route.validator';
import { DistanceCalculatorService, ClsAuditUtils } from '@nexus/common';

// Entities
import { Route } from './entities/route.entity';
import { RouteStop } from './entities/route_stop.entity';
import { RouteHistory } from './entities/route_history.entity';

// Interceptors
import {
  AuditContextInterceptor,
  RouteStatusInterceptor,
  RouteValidationInterceptor,
} from './interceptors';

// Subscribers
import { RouteSubscriber, RouteStopSubscriber } from './subscribers';

// Módulos relacionados
import { VehiclesModule } from '../vehicles/vehicles.module';
import { DriversModule } from '../drivers/drivers.module';
import { DeliveriesModule } from '../deliveries/deliveries.module';
import { GeoServicesModule } from '@nexus/geo-services';

/**
 * Módulo de Rotas
 *
 * Responsabilidades:
 * - CRUD completo de rotas
 * - Gestão de paradas e sequenciamento
 * - Controle de status e transições
 * - Cálculo de métricas e otimização
 * - Validações de disponibilidade
 * - Histórico de alterações
 *
 * Dependências:
 * - VehiclesModule: Validação de veículos
 * - DriversModule: Validação de motoristas
 */
@Module({
  imports: [
    // Registrar entidades do módulo
    TypeOrmModule.forFeature([Route, RouteStop, RouteHistory]),

    // Importar módulos relacionados para validações
    forwardRef(() => VehiclesModule),
    forwardRef(() => DriversModule),
    DeliveriesModule,
    GeoServicesModule,
  ],

  controllers: [RoutesController],

  providers: [
    // Service principal
    RoutesService,

    // Services auxiliares
    RouteOptimizationService,
    RouteValidationService,
    RouteMetricsService,

    // Validators
    RouteValidatorService,
    DistanceCalculatorService,

    // Utils
    ClsAuditUtils,

    // Interceptors (não globais, serão aplicados no controller)
    AuditContextInterceptor,
    RouteStatusInterceptor,
    RouteValidationInterceptor,

    // Subscribers TypeORM
    RouteSubscriber,
    RouteStopSubscriber,
  ],

  exports: [
    // Exportar service para uso em outros módulos
    RoutesService,
    RouteOptimizationService,
    RouteValidationService,
    RouteMetricsService,

    // Exportar TypeORM para acesso aos repositories
    TypeOrmModule,

    // Exportar utils para uso em outros módulos
    ClsAuditUtils,
    // Exportar validators para reutilização
    RouteValidatorService,
    DistanceCalculatorService,
  ],
})
export class RoutesModule {}
