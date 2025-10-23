import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { RoutesController } from './routes.controller';

// Services
import { RoutesService } from './routes.service';

// Validators
import { RouteValidatorService } from './validators/route.validator';
import { DistanceCalculatorService } from './validators/distance_calculator.validator';

// Entities
import { Route } from './entities/route.entity';
import { RouteStop } from './entities/route_stop.entity';
import { RouteHistory } from './entities/route_history.entity';

// Módulos relacionados
import { VehiclesModule } from '../vehicles/vehicles.module';
import { DriversModule } from '../drivers/drivers.module';

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
    VehiclesModule,
    DriversModule,
  ],

  controllers: [RoutesController],

  providers: [
    // Service principal
    RoutesService,

    // Validators
    RouteValidatorService,
    DistanceCalculatorService,
  ],

  exports: [
    // Exportar service para uso em outros módulos
    RoutesService,

    // Exportar TypeORM para acesso aos repositories
    TypeOrmModule,

    // Exportar validators para reutilização
    RouteValidatorService,
    DistanceCalculatorService,
  ],
})
export class RoutesModule {}
