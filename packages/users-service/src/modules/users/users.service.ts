import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

/**
 * Users Service - Microsserviço
 * Mantém FIDELIDADE TOTAL com o monólito
 * 
 * Métodos implementados (idênticos ao monólito):
 * - create: Cria novo usuário com hash de senha
 * - findAll: Lista todos os usuários ativos
 * - findOne: Busca usuário por ID com soft delete check
 * - findByEmail: Busca usuário por email
 * - update: Atualiza dados do usuário
 * - remove: Soft delete do usuário
 * - restore: Restaura usuário deletado
 * - updateLastLogin: Atualiza timestamp de último login
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Cria novo usuário com hash de senha
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(`Creating user: ${createUserDto.email}`);

    // Hash da senha antes de salvar
    const password_hash = await bcrypt.hash(createUserDto.password, 10);

    const userData = {
      ...createUserDto,
      password_hash,
    };

    // Remove password do objeto (já temos password_hash)
    delete (userData as any).password;

    const user = this.userRepository.create(userData);
    const saved = await this.userRepository.save(user);

    this.logger.log(`User created successfully: ${saved.id}`);
    return saved;
  }

  /**
   * Lista todos os usuários ativos (não deletados)
   */
  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      where: { deleted_at: IsNull() },
    });
  }

  /**
   * Busca usuário por ID (apenas não deletados)
   */
  async findOne(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id, deleted_at: IsNull() },
      // Relacionamentos serão adicionados na Fase 2
      // relations: ['roles'],
    });
  }

  /**
   * Busca usuário por email (apenas não deletados)
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email, deleted_at: IsNull() },
      // Relacionamentos serão adicionados na Fase 2
      // relations: ['roles'],
    });
  }

  /**
   * Atualiza timestamp de último login
   */
  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, {
      last_login_at: new Date(),
    });
    this.logger.log(`Updated last login for user: ${id}`);
  }

  /**
   * Atualiza dados do usuário
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    const user = await this.findOne(id);
    if (!user) {
      return null;
    }

    // Se está atualizando a senha, fazer o hash
    if (updateUserDto.password) {
      const password_hash = await bcrypt.hash(updateUserDto.password, 10);
      Object.assign(user, { ...updateUserDto, password_hash });
      delete (user as any).password;
    } else {
      Object.assign(user, updateUserDto);
    }

    const updated = await this.userRepository.save(user);
    this.logger.log(`User updated successfully: ${id}`);
    return updated;
  }

  /**
   * Soft delete do usuário
   */
  async remove(id: string): Promise<boolean> {
    const user = await this.findOne(id);
    if (!user) {
      return false;
    }

    await user.softRemove();
    this.logger.log(`User soft deleted: ${id}`);
    return true;
  }

  /**
   * Restaura usuário deletado
   */
  async restore(id: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!user?.deleted_at) {
      return null;
    }

    await user.restore();
    this.logger.log(`User restored: ${id}`);
    return user;
  }
}
