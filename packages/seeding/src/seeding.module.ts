import { Module, DynamicModule } from "@nestjs/common";
import { SeedingService } from "./seeding.service";
import { RolesSeed } from "./seeds/roles.seed";
import { AdminUserSeed } from "./seeds/admin-user.seed";
import { TestUsersSeed } from "./seeds/test-users.seed";
import { ServiceOrdersSeed } from "./seeds/service-orders.seed";
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
        ServiceOrdersSeed,
      ],
      exports: [SeedingService],
    };
  }
}
