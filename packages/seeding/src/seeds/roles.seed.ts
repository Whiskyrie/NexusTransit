import { Injectable, Logger, Inject } from "@nestjs/common";
import { Repository } from "typeorm";
import { ISeed } from "../interfaces/seed.interface";
import { RoleEntity } from "../interfaces/role.interface";

export enum RoleType {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  MANAGER = "manager",
  OPERATOR = "operator",
  DRIVER = "driver",
  CUSTOMER = "customer",
}

/**
 * Seed de roles do sistema
 *
 * Cria as 5 roles padrão necessárias para o funcionamento do sistema:
 * ADMIN, GESTOR, DESPACHANTE, MOTORISTA, CLIENTE
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

    const roles: Partial<RoleEntity>[] = [
      {
        name: "ADMIN",
        display_name: "Administrador",
        description: "Administrador do sistema com acesso total",
        type: RoleType.ADMIN,
        permissions: ["*"],
        hierarchy_level: 0,
        is_active: true,
      },
      {
        name: "GESTOR",
        display_name: "Gestor",
        description: "Gestor de operações com acesso amplo",
        type: RoleType.MANAGER,
        permissions: [
          "users.read",
          "users.create",
          "users.update",
          "deliveries.read",
          "deliveries.create",
          "deliveries.update",
          "deliveries.delete",
          "drivers.read",
          "drivers.create",
          "drivers.update",
          "drivers.assign",
          "vehicles.read",
          "vehicles.create",
          "vehicles.update",
          "vehicles.assign",
          "routes.read",
          "routes.create",
          "routes.update",
          "reports.read",
          "reports.create",
        ],
        hierarchy_level: 1,
        is_active: true,
      },
      {
        name: "DESPACHANTE",
        display_name: "Despachante",
        description: "Despachante responsável por atribuir entregas",
        type: RoleType.OPERATOR,
        permissions: [
          "deliveries.read",
          "deliveries.create",
          "deliveries.update",
          "drivers.read",
          "drivers.assign",
          "vehicles.read",
          "vehicles.assign",
          "routes.read",
          "routes.create",
          "routes.update",
          "tracking.read",
        ],
        hierarchy_level: 2,
        is_active: true,
      },
      {
        name: "MOTORISTA",
        display_name: "Motorista",
        description: "Motorista responsável por realizar entregas",
        type: RoleType.DRIVER,
        permissions: [
          "deliveries.read",
          "deliveries.update_status",
          "routes.read",
          "tracking.read",
          "tracking.update",
          "profile.read",
          "profile.update",
        ],
        hierarchy_level: 3,
        is_active: true,
      },
      {
        name: "CLIENTE",
        display_name: "Cliente",
        description: "Cliente que solicita entregas",
        type: RoleType.CUSTOMER,
        permissions: [
          "deliveries.read",
          "deliveries.create",
          "deliveries.track",
          "profile.read",
          "profile.update",
        ],
        hierarchy_level: 4,
        is_active: true,
      },
    ];

    for (const roleData of roles) {
      const existing = await this.roleRepository.findOne({
        where: { name: roleData.name },
      });

      if (!existing) {
        const role = this.roleRepository.create(roleData);
        await this.roleRepository.save(role);
        this.logger.log(`Role criada: ${roleData.name}`);
      } else {
        this.logger.debug(`Role já existe: ${roleData.name}`);
      }
    }

    this.logger.log("Seed de roles concluído!");
  }
}
