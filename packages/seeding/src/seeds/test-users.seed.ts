import { Injectable, Logger, Inject } from "@nestjs/common";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { ISeed } from "../interfaces/seed.interface";
import { RoleEntity } from "../interfaces/role.interface";
import { UserEntity } from "../interfaces/user.interface";

/**
 * Seed de usuários de teste
 *
 * Cria usuários para desenvolvimento e testes
 */
@Injectable()
export class TestUsersSeed implements ISeed {
  private readonly logger = new Logger(TestUsersSeed.name);

  constructor(
    @Inject("USER_REPOSITORY")
    private readonly userRepository: Repository<UserEntity>,
    @Inject("ROLE_REPOSITORY")
    private readonly roleRepository: Repository<RoleEntity>,
  ) {}

  async run(): Promise<void> {
    this.logger.log("Iniciando seed de usuários de teste...");

    // Buscar roles
    const managerRole = await this.roleRepository.findOne({
      where: { name: "MANAGER" },
    });
    const driverRole = await this.roleRepository.findOne({
      where: { name: "DRIVER" },
    });
    const customerRole = await this.roleRepository.findOne({
      where: { name: "CUSTOMER" },
    });

    if (!managerRole || !driverRole || !customerRole) {
      throw new Error("Roles não encontradas. Execute o seed de roles primeiro.");
    }

    const testUsers: Array<{
      email: string;
      first_name: string;
      last_name: string;
      phone: string;
      user_type: string;
      role: RoleEntity;
    }> = [
      {
        email: "manager@test.com",
        first_name: "Gerente",
        last_name: "Teste",
        phone: "+5511988888888",
        user_type: "MANAGER",
        role: managerRole,
      },
      {
        email: "driver@test.com",
        first_name: "Motorista",
        last_name: "Teste",
        phone: "+5511977777777",
        user_type: "DRIVER",
        role: driverRole,
      },
      {
        email: "customer@test.com",
        first_name: "Cliente",
        last_name: "Teste",
        phone: "+5511966666666",
        user_type: "CUSTOMER",
        role: customerRole,
      },
    ];

    const defaultPassword = await bcrypt.hash("Test@123", 10);

    for (const userData of testUsers) {
      const existing = await this.userRepository.findOne({
        where: { email: userData.email },
      });

      if (!existing) {
        const user = this.userRepository.create({
          email: userData.email,
          password_hash: defaultPassword,
          first_name: userData.first_name,
          last_name: userData.last_name,
          phone: userData.phone,
          user_type: userData.user_type,
          status: "ACTIVE",
          email_verified: true,
          roles: [userData.role],
        });

        await this.userRepository.save(user);
        this.logger.log(`✅ Usuário criado: ${userData.email}`);
      } else {
        this.logger.log(`ℹ️  Usuário já existe: ${userData.email}`);
      }
    }

    this.logger.log("Seed de usuários de teste concluído!");
    this.logger.log("Senha padrão para todos: Test@123");
  }
}
