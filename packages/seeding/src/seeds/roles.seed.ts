import { Injectable, Logger, Inject } from "@nestjs/common";
import { Repository } from "typeorm";
import { ISeed } from "../interfaces/seed.interface";

// Tipos para o seed
interface RoleEntity {
  id?: string;
  name: string;
  display_name?: string;
  description?: string;
  permissions?: string[];
  hierarchy_level?: number;
  is_active?: boolean;
}

/**
 * Seed de roles do sistema
 *
 * Cria as roles padrão necessárias para o funcionamento do sistema
 */
@Injectable()
export class RolesSeed implements ISeed {
  private readonly logger = new Logger(RolesSeed.name);

  constructor(
    @Inject("ROLE_REPOSITORY")
    private readonly roleRepository: Repository<RoleEntity>,
  ) {}

  async run(): Promise<void> {
    this.logger.log("Iniciando seed de roles...");

    const roles = [
      {
        name: "ADMIN",
        description: "Administrador do sistema com acesso total",
        permissions: ["*"],
      },
      {
        name: "MANAGER",
        description: "Gerente de operações",
        permissions: [
          "deliveries.read",
          "deliveries.create",
          "deliveries.update",
          "drivers.read",
          "drivers.assign",
          "vehicles.read",
          "vehicles.assign",
          "reports.read",
        ],
      },
      {
        name: "DRIVER",
        description: "Motorista",
        permissions: [
          "deliveries.read",
          "deliveries.update_status",
          "profile.read",
          "profile.update",
        ],
      },
      {
        name: "CUSTOMER",
        description: "Cliente",
        permissions: [
          "deliveries.read",
          "deliveries.create",
          "deliveries.track",
          "profile.read",
          "profile.update",
        ],
      },
    ];

    for (const roleData of roles) {
      const existing = await this.roleRepository.findOne({
        where: { name: roleData.name },
      });

      if (!existing) {
        const role = this.roleRepository.create(roleData);
        await this.roleRepository.save(role);
        this.logger.log(`✅ Role criada: ${roleData.name}`);
      } else {
        this.logger.log(`ℹ️  Role já existe: ${roleData.name}`);
      }
    }

    this.logger.log("Seed de roles concluído!");
  }
}
