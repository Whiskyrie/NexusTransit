import { Injectable, Logger, Inject } from "@nestjs/common";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { ISeed } from "../interfaces/seed.interface";
import { RoleEntity } from "../interfaces/role.interface";
import { UserEntity } from "../interfaces/user.interface";

/**
 * Seed do usuário administrador padrão
 *
 * Cria o primeiro usuário admin do sistema
 */
@Injectable()
export class AdminUserSeed implements ISeed {
  private readonly logger = new Logger(AdminUserSeed.name);

  constructor(
    @Inject("USER_REPOSITORY")
    private readonly userRepository: Repository<UserEntity>,
    @Inject("ROLE_REPOSITORY")
    private readonly roleRepository: Repository<RoleEntity>,
  ) {}

  async run(): Promise<void> {
    this.logger.log("Iniciando seed do usuário admin...");

    const adminEmail = "admin@nexustransit.com";

    // Verificar se já existe
    const existing = await this.userRepository.findOne({
      where: { email: adminEmail },
    });

    if (existing) {
      this.logger.log("Usuário admin já existe");
      return;
    }

    // Buscar role ADMIN
    const adminRole = await this.roleRepository.findOne({
      where: { name: "ADMIN" },
    });

    if (!adminRole) {
      throw new Error("Role ADMIN não encontrada. Execute o seed de roles primeiro.");
    }

    // Criar usuário admin
    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    const admin = this.userRepository.create({
      email: adminEmail,
      password_hash: hashedPassword,
      first_name: "Administrador",
      last_name: "Sistema",
      phone: "+5511999999999",
      user_type: "ADMIN",
      status: "ACTIVE",
      email_verified: true,
      roles: [adminRole],
    });

    await this.userRepository.save(admin);

    this.logger.log("Usuário admin criado com sucesso!");
    this.logger.log(`Email: ${adminEmail}`);
    this.logger.log(`Senha: Admin@123`);
  }
}
