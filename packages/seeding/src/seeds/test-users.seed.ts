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

    // Buscar todas as 5 roles
    const adminRole = await this.roleRepository.findOne({
      where: { name: "ADMIN" },
    });
    const gestorRole = await this.roleRepository.findOne({
      where: { name: "GESTOR" },
    });
    const despachanteRole = await this.roleRepository.findOne({
      where: { name: "DESPACHANTE" },
    });
    const motoristaRole = await this.roleRepository.findOne({
      where: { name: "MOTORISTA" },
    });
    const clienteRole = await this.roleRepository.findOne({
      where: { name: "CLIENTE" },
    });

    if (!adminRole || !gestorRole || !despachanteRole || !motoristaRole || !clienteRole) {
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
        email: "admin.teste@nexustransit.com",
        first_name: "Admin",
        last_name: "Teste",
        phone: "+5511999999999",
        user_type: "ADMIN",
        role: adminRole,
      },
      {
        email: "gestor.teste@nexustransit.com",
        first_name: "Gestor",
        last_name: "Teste",
        phone: "+5511988888888",
        user_type: "GESTOR",
        role: gestorRole,
      },
      {
        email: "despachante.teste@nexustransit.com",
        first_name: "Despachante",
        last_name: "Teste",
        phone: "+5511977777777",
        user_type: "DESPACHANTE",
        role: despachanteRole,
      },
      {
        email: "motorista.teste@nexustransit.com",
        first_name: "Motorista",
        last_name: "Teste",
        phone: "+5511966666666",
        user_type: "MOTORISTA",
        role: motoristaRole,
      },
      {
        email: "cliente.teste@nexustransit.com",
        first_name: "Cliente",
        last_name: "Teste",
        phone: "+5511955555555",
        user_type: "CLIENTE",
        role: clienteRole,
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
        this.logger.log(`Usuário criado: ${userData.email}`);
      } else {
        this.logger.debug(`Usuário já existe: ${userData.email}`);
      }
    }

    this.logger.log("Seed de usuários de teste concluído!");
    this.logger.log("Senha padrão para todos: Test@123");
  }
}
