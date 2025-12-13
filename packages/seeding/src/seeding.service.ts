import { Injectable, Logger, Inject } from "@nestjs/common";
import { DataSource } from "typeorm";
import { RolesSeed } from "./seeds/roles.seed";
import { AdminUserSeed } from "./seeds/admin-user.seed";
import { TestUsersSeed } from "./seeds/test-users.seed";

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
      this.logger.log("[1/3] Executando seed de roles...");
      await this.rolesSeed.run();

      // 2. Seed do usuário admin - executa em todos ambientes
      this.logger.log("[2/3] Executando seed do admin...");
      await this.adminUserSeed.run();

      // 3. Seeds de usuários de teste - apenas em dev e test
      if (env !== "prod") {
        this.logger.log("[3/3] Executando seed de usuários de teste...");
        await this.testUsersSeed.run();
      } else {
        this.logger.log("[3/3] Pulando seed de usuários de teste (ambiente prod)");
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
   * @param seedName Nome do seed (roles, admin, users)
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
    return ["roles", "admin", "users"];
  }
}
