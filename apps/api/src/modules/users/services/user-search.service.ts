import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  ILike,
  FindOptionsWhere,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
} from 'typeorm';
import { User } from '../entities/user.entity';
import { UserFilterDto } from '../dto/user-filter.dto';
import { UserStatus } from '../enums/user-status.enum';
import { UserType } from '../enums/user-type.enum';

/**
 * Campos válidos para ordenação
 */
const VALID_SORT_FIELDS = [
  'created_at',
  'updated_at',
  'email',
  'first_name',
  'last_name',
  'status',
] as const;

type SortField = (typeof VALID_SORT_FIELDS)[number];
type SortOrder = 'ASC' | 'DESC';

/**
 * Interface para resultado de contagem por grupo
 */
interface CountResult {
  status?: string;
  type?: string;
  count: string;
}

/**
 * Interface para metadados de paginação
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_previous: boolean;
  has_next: boolean;
}

/**
 * Interface para resultado paginado
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Interface para contagem por status
 */
export type StatusCount = Record<UserStatus, number>;

/**
 * Interface para contagem por tipo
 */
export type TypeCount = Record<UserType, number>;

/**
 * Opções para busca por período
 */
export interface DateRangeOptions {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

/**
 * Serviço de busca avançada de usuários
 *
 * Responsável por:
 * - Busca com filtros complexos
 * - Paginação
 * - Ordenação
 * - Busca por texto
 */
@Injectable()
export class UserSearchService {
  private readonly logger = new Logger(UserSearchService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Busca usuários com filtros e paginação
   *
   * @param filterDto - DTO com filtros de busca
   * @returns Resultado paginado com usuários
   */
  async search(filterDto: UserFilterDto): Promise<PaginatedResult<User>> {
    const {
      search,
      status,
      user_type,
      email_verified,
      created_after,
      created_before,
      page = 1,
      limit = 10,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = filterDto;

    // Construir query builder para filtros complexos
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // Filtro de busca por texto (nome, email) - usando parâmetro para evitar SQL injection
    if (search) {
      const searchPattern = `%${this.escapeSearchPattern(search)}%`;
      queryBuilder.andWhere(
        '(user.first_name ILIKE :search OR user.last_name ILIKE :search OR user.email ILIKE :search)',
        { search: searchPattern },
      );
    }

    // Filtro por status
    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    // Filtro por tipo de usuário
    if (user_type) {
      queryBuilder.andWhere('user.user_type = :user_type', { user_type });
    }

    // Filtro por email verificado
    if (email_verified !== undefined) {
      queryBuilder.andWhere('user.email_verified = :email_verified', {
        email_verified,
      });
    }

    // Filtro por data de criação (após)
    if (created_after) {
      queryBuilder.andWhere('user.created_at >= :created_after', {
        created_after,
      });
    }

    // Filtro por data de criação (antes)
    if (created_before) {
      queryBuilder.andWhere('user.created_at <= :created_before', {
        created_before,
      });
    }

    // Aplicar ordenação com validação
    const sortField = this.validateSortField(sort_by);
    const order = this.validateSortOrder(sort_order);

    queryBuilder.orderBy(`user.${sortField}`, order);

    // Aplicar paginação
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Executar query
    const [users, total] = await queryBuilder.getManyAndCount();

    // Calcular metadados de paginação
    const totalPages = Math.ceil(total / limit);

    this.logger.debug(`Busca de usuários: ${total} resultados, página ${page}/${totalPages}`);

    return {
      data: users,
      meta: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_previous: page > 1,
        has_next: page < totalPages,
      },
    };
  }

  /**
   * Busca usuários por email (parcial) usando FindOptionsWhere
   *
   * @param email - Email ou parte do email
   * @param limit - Limite de resultados
   * @returns Lista de usuários
   */
  async searchByEmail(email: string, limit = 10): Promise<User[]> {
    const where: FindOptionsWhere<User> = {
      email: ILike(`%${this.escapeSearchPattern(email)}%`),
    };

    return this.userRepository.find({
      where,
      take: limit,
      order: {
        email: 'ASC',
      },
    });
  }

  /**
   * Busca usuários por nome (primeiro ou último nome)
   *
   * @param name - Nome ou parte do nome
   * @param limit - Limite de resultados
   * @returns Lista de usuários
   */
  async searchByName(name: string, limit = 10): Promise<User[]> {
    const searchPattern = `%${this.escapeSearchPattern(name)}%`;

    return this.userRepository
      .createQueryBuilder('user')
      .where('(user.first_name ILIKE :name OR user.last_name ILIKE :name)', {
        name: searchPattern,
      })
      .take(limit)
      .orderBy('user.first_name', 'ASC')
      .getMany();
  }

  /**
   * Busca usuários ativos usando FindOptionsWhere
   *
   * @param limit - Limite de resultados
   * @returns Lista de usuários ativos
   */
  async findActiveUsers(limit = 10): Promise<User[]> {
    const where: FindOptionsWhere<User> = {
      status: UserStatus.ACTIVE,
    };

    return this.userRepository.find({
      where,
      take: limit,
      order: {
        last_login_at: 'DESC',
      },
    });
  }

  /**
   * Busca usuários recém-cadastrados usando FindOptionsWhere
   *
   * @param days - Número de dias para considerar "recente"
   * @param limit - Limite de resultados
   * @returns Lista de usuários recentes
   */
  async findRecentUsers(days = 7, limit = 10): Promise<User[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: FindOptionsWhere<User> = {
      created_at: Between(startDate, new Date()),
    };

    return this.userRepository.find({
      where,
      take: limit,
      order: {
        created_at: 'DESC',
      },
    });
  }

  /**
   * Busca usuários criados em um período usando FindOptionsWhere
   * Demonstra uso de MoreThanOrEqual e LessThanOrEqual
   *
   * @param options - Opções de busca por período
   * @returns Lista de usuários no período
   */
  async findByDateRange(options: DateRangeOptions): Promise<User[]> {
    const { startDate, endDate, limit = 10 } = options;

    const where: FindOptionsWhere<User> = {};

    // Usa operadores específicos baseado nos parâmetros fornecidos
    if (startDate && endDate) {
      where.created_at = Between(startDate, endDate);
    } else if (startDate) {
      where.created_at = MoreThanOrEqual(startDate);
    } else if (endDate) {
      where.created_at = LessThanOrEqual(endDate);
    }

    return this.userRepository.find({
      where,
      take: limit,
      order: {
        created_at: 'DESC',
      },
    });
  }

  /**
   * Busca usuários por tipo usando FindOptionsWhere
   *
   * @param userType - Tipo de usuário
   * @param limit - Limite de resultados
   * @returns Lista de usuários do tipo especificado
   */
  async findByType(userType: UserType, limit = 10): Promise<User[]> {
    const where: FindOptionsWhere<User> = {
      user_type: userType,
    };

    return this.userRepository.find({
      where,
      take: limit,
      order: {
        created_at: 'DESC',
      },
    });
  }

  /**
   * Busca usuários com múltiplos filtros usando FindOptionsWhere
   *
   * @param filters - Filtros parciais de User
   * @param limit - Limite de resultados
   * @returns Lista de usuários filtrados
   */
  async findByFilters(
    filters: Partial<Pick<User, 'status' | 'user_type' | 'email_verified'>>,
    limit = 10,
  ): Promise<User[]> {
    const where: FindOptionsWhere<User> = {};

    if (filters.status !== undefined) {
      where.status = filters.status;
    }

    if (filters.user_type !== undefined) {
      where.user_type = filters.user_type;
    }

    if (filters.email_verified !== undefined) {
      where.email_verified = filters.email_verified;
    }

    return this.userRepository.find({
      where,
      take: limit,
      order: {
        created_at: 'DESC',
      },
    });
  }

  /**
   * Conta usuários por status
   *
   * @returns Contagem de usuários por status
   */
  async countByStatus(): Promise<StatusCount> {
    // Inicializar com todos os valores do enum
    const counts: StatusCount = {
      [UserStatus.ACTIVE]: 0,
      [UserStatus.INACTIVE]: 0,
      [UserStatus.SUSPENDED]: 0,
    };

    const results = await this.userRepository
      .createQueryBuilder('user')
      .select('user.status', 'status')
      .addSelect('COUNT(user.id)', 'count')
      .groupBy('user.status')
      .getRawMany<CountResult>();

    for (const result of results) {
      if (result.status && this.isValidStatus(result.status)) {
        counts[result.status] = this.parseCount(result.count);
      }
    }

    return counts;
  }

  /**
   * Conta usuários por tipo
   *
   * @returns Contagem de usuários por tipo
   */
  async countByType(): Promise<TypeCount> {
    // Inicializar com todos os valores do enum
    const counts = this.initializeTypeCount();

    const results = await this.userRepository
      .createQueryBuilder('user')
      .select('user.user_type', 'type')
      .addSelect('COUNT(user.id)', 'count')
      .groupBy('user.user_type')
      .getRawMany<CountResult>();

    for (const result of results) {
      if (result.type && this.isValidType(result.type)) {
        counts[result.type] = this.parseCount(result.count);
      }
    }

    return counts;
  }

  // ============================================
  // Métodos auxiliares privados
  // ============================================

  /**
   * Escapa caracteres especiais do padrão de busca LIKE
   *
   * @param pattern - Padrão de busca
   * @returns Padrão escapado
   */
  private escapeSearchPattern(pattern: string): string {
    return pattern.replace(/[%_\\]/g, '\\$&');
  }

  /**
   * Valida e retorna campo de ordenação
   *
   * @param field - Campo solicitado
   * @returns Campo validado ou padrão
   */
  private validateSortField(field: string): SortField {
    if (VALID_SORT_FIELDS.includes(field as SortField)) {
      return field as SortField;
    }
    return 'created_at';
  }

  /**
   * Valida e retorna ordem de classificação
   *
   * @param order - Ordem solicitada
   * @returns Ordem validada
   */
  private validateSortOrder(order: string): SortOrder {
    const upperOrder = order.toUpperCase();
    return upperOrder === 'ASC' ? 'ASC' : 'DESC';
  }

  /**
   * Converte string para número de forma segura
   *
   * @param value - Valor a converter
   * @returns Número convertido ou 0
   */
  private parseCount(value: string): number {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Verifica se valor é um UserStatus válido
   *
   * @param value - Valor a verificar
   * @returns True se válido
   */
  private isValidStatus(value: string): value is UserStatus {
    return Object.values(UserStatus).includes(value as UserStatus);
  }

  /**
   * Verifica se valor é um UserType válido
   *
   * @param value - Valor a verificar
   * @returns True se válido
   */
  private isValidType(value: string): value is UserType {
    return Object.values(UserType).includes(value as UserType);
  }

  /**
   * Inicializa contagem de tipos com zero
   *
   * @returns Record inicializado
   */
  private initializeTypeCount(): TypeCount {
    const counts = {} as TypeCount;

    for (const type of Object.values(UserType)) {
      counts[type] = 0;
    }

    return counts;
  }
}
