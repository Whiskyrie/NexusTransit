import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserValidationService } from './services/user-validation.service';
import { UserSearchService } from './services/user-search.service';
import { UserNotFoundException } from './exceptions/user.exceptions';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly validationService: UserValidationService,
    private readonly searchService: UserSearchService,
  ) {}

  /**
   * Cria novo usuário com validações completas
   */
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // 1. Validações de negócio
    await this.validationService.validateUserCreation(createUserDto.email, createUserDto.password);

    // 2. Preparar dados (senha será hasheada pelo subscriber)
    const userData: Partial<User> = {
      ...createUserDto,
      password_hash: createUserDto.password, // Subscriber vai hashear
    };

    // 3. Criar e salvar
    const user = this.userRepository.create(userData);
    const saved = await this.userRepository.save(user);

    this.logger.log(`Usuário criado: ${saved.id} - ${saved.email}`);

    // 4. Retornar DTO de resposta (sem campos sensíveis)
    return this.mapToResponseDto(saved);
  }

  /**
   * Lista usuários com filtros e paginação
   */
  async findAll(filterDto: UserFilterDto): Promise<{
    data: UserResponseDto[];
    meta: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
      has_previous: boolean;
      has_next: boolean;
    };
  }> {
    const result = await this.searchService.search(filterDto);

    return {
      ...result,
      data: result.data.map(user => this.mapToResponseDto(user)),
    };
  }

  /**
   * Busca usuário por ID
   */
  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles'],
    });

    if (!user) {
      throw new UserNotFoundException(id);
    }

    return this.mapToResponseDto(user);
  }

  /**
   * Busca usuário por email (para autenticação)
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.trim().toLowerCase() },
      relations: ['roles'],
    });
  }

  /**
   * Atualiza último login
   */
  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, {
      last_login_at: new Date(),
    });
  }

  /**
   * Atualiza usuário
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    // 1. Buscar usuário
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new UserNotFoundException(id);
    }

    // 2. Validar dados de atualização
    await this.validationService.validateUserUpdate(id, updateUserDto.email);

    // 3. Aplicar mudanças
    Object.assign(user, updateUserDto);
    const updated = await this.userRepository.save(user);

    this.logger.log(`Usuário atualizado: ${id}`);

    return this.mapToResponseDto(updated);
  }

  /**
   * Remove usuário (soft delete)
   */
  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new UserNotFoundException(id);
    }

    // Validar se pode ser deletado
    this.validationService.validateUserCanBeDeleted(id);

    await this.userRepository.softRemove(user);

    this.logger.log(`Usuário removido: ${id}`);
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

    await this.userRepository.recover(user);

    this.logger.log(`Usuário restaurado: ${id}`);

    return user;
  }

  // ============================================
  // Métodos auxiliares privados
  // ============================================

  /**
   * Mapeia entidade User para DTO de resposta
   */
  private mapToResponseDto(user: User): UserResponseDto {
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: false,
      enableImplicitConversion: true,
    });
  }
}
