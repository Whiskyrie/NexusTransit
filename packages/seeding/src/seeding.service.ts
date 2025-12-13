import { Injectable, Logger } from "@nestjs/common";
import { RolesSeed } from "./seeds/roles.seed";
import { AdminUserSeed } from "./seeds/admin-user.seed";
import { TestUsersSeed } from "./seeds/test-users.seed";

/**
 * Serviço principal de seeding
 *
 * Coordena a execução de todos os seeds do sistema
 */
@Injectable()
export class SeedingService {
  private readonly logger = new Logger(SeedingService.name);

  constructor(
    private readonly rolesSeed: RolesSeed,
    private readonly adminUserSeed: AdminUserSeed,
    private readonly testUsersSeed: TestUsersSeed,
  ) {}

  /**
   * Executa todos os seeds em ordem
   */
  async runAllSeeds(): Promise<void> {
    this.logger.log("Iniciando processo de seeding...");

    try {
      // 1. Seeds de roles (dependência para usuários)
      await this.rolesSeed.run();

      // 2. Seed do usuário admin
      await this.adminUserSeed.run();

      // 3. Seeds de usuários de teste
      await this.testUsersSeed.run();

      this.logger.log("✅ Seeding concluído com sucesso!");
    } catch (error) {
      this.logger.error("❌ Erro durante o seeding:", error);
      throw error;
    }
  }

  /**
   * Executa seed específico por nome
   */
  async runSeed(seedName: string): Promise<void> {
    this.logger.log(`Executando seed: ${seedName}`);

    switch (seedName.toLowerCase()) {
      case "roles":
        await this.rolesSeed.run();
        break;
      case "admin":
        await this.adminUserSeed.run();
        break;
      case "users":
        await this.testUsersSeed.run();
        break;
      default:
        throw new Error(`Seed não encontrado: ${seedName}`);
    }

    this.logger.log(`✅ Seed '${seedName}' concluído!`);
  }
}
