import { Injectable, Logger, Inject } from "@nestjs/common";
import { DataSource } from "typeorm";
import { RolesSeed } from "./seeds/roles.seed";
import { AdminUserSeed } from "./seeds/admin-user.seed";
import { TestUsersSeed } from "./seeds/test-users.seed";
import { DriversSeed } from "./seeds/drivers.seed";
import { VehiclesSeed } from "./seeds/vehicles.seed";
import { RoutesSeed } from "./seeds/routes.seed";

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
      this.logger.log("[1/6] Executando seed de roles...");
      await this.rolesSeed.run();

      // 2. Seed do usuário admin - executa em todos ambientes
      this.logger.log("[2/6] Executando seed do admin...");
      await this.adminUserSeed.run();

      // 3. Seeds de usuários de teste - apenas em dev e test
      if (env !== "prod") {
        this.logger.log("[3/6] Executando seed de usuários de teste...");
        await this.testUsersSeed.run();
      } else {
        this.logger.log("[3/6] Pulando seed de usuários de teste (ambiente prod)");
      }

      // 4. Seeds de motoristas - apenas em dev e test
      if (env !== "prod") {
        this.logger.log("[4/6] Executando seed de motoristas...");
        await this.driversSeed.run();
      } else {
        this.logger.log("[4/6] Pulando seed de motoristas (ambiente prod)");
      }

      // 5. Seeds de veículos - apenas em dev e test
      if (env !== "prod") {
        this.logger.log("[5/6] Executando seed de veículos...");
        await this.vehiclesSeed.run();
      } else {
        this.logger.log("[5/6] Pulando seed de veículos (ambiente prod)");
      }

      // 6. Seeds de rotas - apenas em dev e test (depende de motoristas e veículos)
      if (env !== "prod") {
        this.logger.log("[6/6] Executando seed de rotas...");
        await this.routesSeed.run();
      } else {
        this.logger.log("[6/6] Pulando seed de rotas (ambiente prod)");
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
    return ["roles", "admin", "users", "drivers", "vehicles", "routes"];
  }
}
