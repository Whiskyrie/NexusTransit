import { Injectable, Logger, Inject } from "@nestjs/common";
import { DataSource } from "typeorm";
import { RolesSeed } from "./seeds/roles.seed";
import { AdminUserSeed } from "./seeds/admin-user.seed";
import { TestUsersSeed } from "./seeds/test-users.seed";
import { DriversSeed } from "./seeds/drivers.seed";
import { VehiclesSeed } from "./seeds/vehicles.seed";
import { RoutesSeed } from "./seeds/routes.seed";
import { CustomersSeed } from "./seeds/customers.seed";
import { ServiceOrdersSeed } from "./seeds/service-orders.seed";
import { DeliveriesExpandedSeed } from "./seeds/deliveries-expanded.seed";
import { TrackingSeed } from "./seeds/tracking.seed";
import { IncidentsSeed } from "./seeds/incidents.seed";

/**
 * Ambiente de execução dos seeds
 */
export type SeedEnvironment = "dev" | "test" | "prod";

/**
 * Serviço principal de seeding
 *
 * Coordena a execução de todos os seeds do sistema com suporte a:
 * - Diferentes ambientes (dev, test, prod)
 * - Rollback em caso de erro
 * - Logs detalhados
 */
@Injectable()
export class SeedingService {
  private readonly logger = new Logger(SeedingService.name);

  constructor(
    @Inject("DATA_SOURCE")
    private readonly dataSource: DataSource,
    private readonly rolesSeed: RolesSeed,
    private readonly adminUserSeed: AdminUserSeed,
    private readonly testUsersSeed: TestUsersSeed,
    private readonly driversSeed: DriversSeed,
    private readonly vehiclesSeed: VehiclesSeed,
    private readonly routesSeed: RoutesSeed,
    private readonly customersSeed: CustomersSeed,
    private readonly serviceOrdersSeed: ServiceOrdersSeed,
    private readonly deliveriesExpandedSeed: DeliveriesExpandedSeed,
    private readonly trackingSeed: TrackingSeed,
    private readonly incidentsSeed: IncidentsSeed,
  ) {}

  /**
   * Executa todos os seeds em ordem com suporte a transação e rollback
   *
   * @param env Ambiente de execução (dev, test, prod)
   */
  async runAllSeeds(env: SeedEnvironment = "dev"): Promise<void> {
    this.logger.log(`Iniciando processo de seeding para ambiente: ${env}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Seeds de roles (dependência para usuários) - executa em todos ambientes
      this.logger.log("[1/11] Executando seed de roles...");
      await this.rolesSeed.run();

      // 2. Seed do usuário admin - executa em todos ambientes
      this.logger.log("[2/11] Executando seed do admin...");
      await this.adminUserSeed.run();

      // 3. Seeds de usuários de teste - apenas em dev e test
      if (env !== "prod") {
        this.logger.log("[3/11] Executando seed de usuários de teste...");
        await this.testUsersSeed.run();
      } else {
        this.logger.log("[3/11] Pulando seed de usuários de teste (ambiente prod)");
      }

      // 4. Seeds de motoristas - apenas em dev e test
      if (env !== "prod") {
        this.logger.log("[4/11] Executando seed de motoristas...");
        await this.driversSeed.run();
      } else {
        this.logger.log("[4/11] Pulando seed de motoristas (ambiente prod)");
      }

      // 5. Seeds de veículos - apenas em dev e test
      if (env !== "prod") {
        this.logger.log("[5/11] Executando seed de veículos...");
        await this.vehiclesSeed.run();
      } else {
        this.logger.log("[5/11] Pulando seed de veículos (ambiente prod)");
      }

      // 6. Seeds de rotas - apenas em dev e test (depende de motoristas e veículos)
      if (env !== "prod") {
        this.logger.log("[6/11] Executando seed de rotas...");
        await this.routesSeed.run();
      } else {
        this.logger.log("[6/11] Pulando seed de rotas (ambiente prod)");
      }

      // 7. Seeds de clientes - apenas em dev e test
      if (env !== "prod") {
        this.logger.log("[7/11] Executando seed de clientes...");
        await this.customersSeed.run();
      } else {
        this.logger.log("[7/11] Pulando seed de clientes (ambiente prod)");
      }

      // 8. Seeds de ordens de serviço - apenas em dev e test (depende de clientes)
      if (env !== "prod") {
        this.logger.log("[8/11] Executando seed de ordens de serviço...");
        await this.serviceOrdersSeed.run();
      } else {
        this.logger.log("[8/11] Pulando seed de ordens de serviço (ambiente prod)");
      }

      // 9. Seeds de entregas expandido - apenas em dev e test (depende de clientes, motoristas, veículos)
      if (env !== "prod") {
        this.logger.log("[9/11] Executando seed de entregas expandido...");
        await this.deliveriesExpandedSeed.run();
      } else {
        this.logger.log("[9/11] Pulando seed de entregas expandido (ambiente prod)");
      }

      // 10. Seeds de tracking - apenas em dev e test (depende de entregas)
      if (env !== "prod") {
        this.logger.log("[10/11] Executando seed de tracking...");
        await this.trackingSeed.run();
      } else {
        this.logger.log("[10/11] Pulando seed de tracking (ambiente prod)");
      }

      // 11. Seeds de incidentes - apenas em dev e test (depende de motoristas, veículos, entregas)
      if (env !== "prod") {
        this.logger.log("[11/11] Executando seed de incidentes...");
        await this.incidentsSeed.run();
      } else {
        this.logger.log("[11/11] Pulando seed de incidentes (ambiente prod)");
      }

      // Commit da transação
      await queryRunner.commitTransaction();
      this.logger.log("Seeding concluído com sucesso");
    } catch (error) {
      // Rollback em caso de erro
      this.logger.error("Erro durante o seeding. Executando rollback...");
      await queryRunner.rollbackTransaction();
      this.logger.warn("Rollback executado");
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Executa seed específico por nome
   *
   * @param seedName Nome do seed (roles, admin, users, drivers, vehicles, routes)
   * @param env Ambiente de execução
   */
  async runSeed(seedName: string, env: SeedEnvironment = "dev"): Promise<void> {
    this.logger.log(`Executando seed: ${seedName} (env: ${env})`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      switch (seedName.toLowerCase()) {
        case "roles":
          await this.rolesSeed.run();
          break;
        case "admin":
          await this.rolesSeed.run(); // Dependência
          await this.adminUserSeed.run();
          break;
        case "users":
          if (env === "prod") {
            throw new Error("Seed de usuários de teste não pode ser executado em produção");
          }
          await this.rolesSeed.run(); // Dependência
          await this.testUsersSeed.run();
          break;
        case "drivers":
          if (env === "prod") {
            throw new Error("Seed de motoristas não pode ser executado em produção");
          }
          await this.driversSeed.run();
          break;
        case "vehicles":
          if (env === "prod") {
            throw new Error("Seed de veículos não pode ser executado em produção");
          }
          await this.vehiclesSeed.run();
          break;
        case "routes":
          if (env === "prod") {
            throw new Error("Seed de rotas não pode ser executado em produção");
          }
          // Executar dependências primeiro
          await this.driversSeed.run();
          await this.vehiclesSeed.run();
          await this.routesSeed.run();
          break;
        case "customers":
          if (env === "prod") {
            throw new Error("Seed de clientes não pode ser executado em produção");
          }
          await this.customersSeed.run();
          break;
        case "deliveries":
          if (env === "prod") {
            throw new Error("Seed de entregas não pode ser executado em produção");
          }
          // Executar dependências primeiro
          await this.driversSeed.run();
          await this.vehiclesSeed.run();
          await this.customersSeed.run();
          await this.deliveriesExpandedSeed.run();
          break;
        case "tracking":
          if (env === "prod") {
            throw new Error("Seed de tracking não pode ser executado em produção");
          }
          await this.trackingSeed.run();
          break;
        case "incidents":
          if (env === "prod") {
            throw new Error("Seed de incidentes não pode ser executado em produção");
          }
          await this.incidentsSeed.run();
          break;
        default:
          throw new Error(`Seed não encontrado: ${seedName}`);
      }

      await queryRunner.commitTransaction();
      this.logger.log(`Seed '${seedName}' concluído`);
    } catch (error) {
      this.logger.error(`Erro no seed '${seedName}'. Executando rollback...`);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Lista todos os seeds disponíveis
   */
  getAvailableSeeds(): string[] {
    return [
      "roles",
      "admin",
      "users",
      "drivers",
      "vehicles",
      "routes",
      "customers",
      "deliveries",
      "tracking",
      "incidents",
    ];
  }
}
