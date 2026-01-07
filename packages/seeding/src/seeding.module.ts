import { Module, DynamicModule } from "@nestjs/common";
import { SeedingService } from "./seeding.service";
import { RolesSeed } from "./seeds/roles.seed";
import { AdminUserSeed } from "./seeds/admin-user.seed";
import { TestUsersSeed } from "./seeds/test-users.seed";
import { DriversSeed } from "./seeds/drivers.seed";
import { VehiclesSeed } from "./seeds/vehicles.seed";
import { RoutesSeed } from "./seeds/routes.seed";
import { ServiceOrdersSeed } from "./seeds/service-orders.seed";
import { CustomersSeed } from "./seeds/customers.seed";
import { DeliveriesExpandedSeed } from "./seeds/deliveries-expanded.seed";
import { TrackingSeed } from "./seeds/tracking.seed";
import { IncidentsSeed } from "./seeds/incidents.seed";
import { seedingProviders } from "./seeding.providers";
import { DataSource } from "typeorm";

/**
 * Módulo de seeding do banco de dados
 *
 * Fornece serviços e seeds para popular o banco com dados iniciais
 */
@Module({})
export class SeedingModule {
  /**
   * Registra o módulo de seeding com um DataSource fornecido
   *
   * @param dataSource DataSource do TypeORM para acesso ao banco
   */
  static forRoot(dataSource: DataSource): DynamicModule {
    return {
      module: SeedingModule,
      providers: [
        {
          provide: "DATA_SOURCE",
          useValue: dataSource,
        },
        ...seedingProviders.filter((p) => p.provide !== "DATA_SOURCE"),
        SeedingService,
        RolesSeed,
        AdminUserSeed,
        TestUsersSeed,
        DriversSeed,
        VehiclesSeed,
        RoutesSeed,
        ServiceOrdersSeed,
        CustomersSeed,
        DeliveriesExpandedSeed,
        TrackingSeed,
        IncidentsSeed,
      ],
      exports: [SeedingService],
    };
  }
}
