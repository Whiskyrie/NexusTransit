import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '@nexus/redis';
import { Role } from '@nexus/auth';
import { Role as RoleEntity } from '../../auth/entities/role.entity';

/**
 * Service para Cache de Roles e Permissões
 *
 * Utiliza Redis para cache de roles por usuário e permissões por role
 * para melhorar a performance de verificações de autorização
 */
@Injectable()
export class RoleCacheService {
  private readonly logger = new Logger(RoleCacheService.name);
  private readonly CACHE_TTL = 3600; // 1 hora em segundos
  private readonly USER_ROLES_PREFIX = 'user:roles:';
  private readonly ROLE_PERMISSIONS_PREFIX = 'role:permissions:';

  constructor(private readonly redisService: RedisService) {}

  /**
   * Obtém os roles de um usuário do cache
   */
  async getUserRoles(userId: string): Promise<RoleEntity[] | null> {
    const cacheKey = `${this.USER_ROLES_PREFIX}${userId}`;

    try {
      const cached = await this.redisService.get<RoleEntity[]>(cacheKey);

      if (cached) {
        this.logger.debug(`Cache hit para roles do usuário: ${userId}`);
        return cached;
      }

      this.logger.debug(`Cache miss para roles do usuário: ${userId}`);
      return null;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar cache de roles: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      return null;
    }
  }

  /**
   * Armazena os roles de um usuário no cache
   */
  async setUserRoles(userId: string, roles: RoleEntity[]): Promise<void> {
    const cacheKey = `${this.USER_ROLES_PREFIX}${userId}`;

    try {
      await this.redisService.set(cacheKey, roles, this.CACHE_TTL * 1000);

      this.logger.debug(
        `Roles do usuário armazenados em cache: ${userId} (TTL: ${this.CACHE_TTL}s)`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao armazenar cache de roles: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  /**
   * Obtém as permissões de um role do cache
   */
  async getRolePermissions(roleName: string): Promise<string[] | null> {
    const cacheKey = `${this.ROLE_PERMISSIONS_PREFIX}${roleName}`;

    try {
      const cached = await this.redisService.get<string[]>(cacheKey);

      if (cached) {
        this.logger.debug(`Cache hit para permissões do role: ${roleName}`);
        return cached;
      }

      this.logger.debug(`Cache miss para permissões do role: ${roleName}`);
      return null;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar cache de permissões: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      return null;
    }
  }

  /**
   * Armazena as permissões de um role no cache
   */
  async setRolePermissions(roleName: string, permissions: string[]): Promise<void> {
    const cacheKey = `${this.ROLE_PERMISSIONS_PREFIX}${roleName}`;

    try {
      await this.redisService.set(cacheKey, permissions, this.CACHE_TTL * 1000);

      this.logger.debug(
        `Permissões do role armazenadas em cache: ${roleName} (TTL: ${this.CACHE_TTL}s)`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao armazenar cache de permissões: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  /**
   * Obtém todas as permissões de um usuário (agregando de todos os roles)
   */
  async getUserPermissions(userId: string, _userRoles: Role[]): Promise<string[] | null> {
    const cacheKey = `user:permissions:${userId}`;

    try {
      const cached = await this.redisService.get<string[]>(cacheKey);

      if (cached) {
        this.logger.debug(`Cache hit para permissões do usuário: ${userId}`);
        return cached;
      }

      this.logger.debug(`Cache miss para permissões do usuário: ${userId}`);
      return null;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar cache de permissões do usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      return null;
    }
  }

  /**
   * Armazena todas as permissões de um usuário no cache
   */
  async setUserPermissions(userId: string, permissions: string[]): Promise<void> {
    const cacheKey = `user:permissions:${userId}`;

    try {
      await this.redisService.set(cacheKey, permissions, this.CACHE_TTL * 1000);

      this.logger.debug(
        `Permissões do usuário armazenadas em cache: ${userId} (TTL: ${this.CACHE_TTL}s)`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao armazenar cache de permissões do usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  /**
   * Invalida o cache de roles de um usuário
   */
  async invalidateUserRoles(userId: string): Promise<void> {
    const cacheKey = `${this.USER_ROLES_PREFIX}${userId}`;

    try {
      await this.redisService.delete(cacheKey);

      this.logger.debug(`Cache de roles invalidado para usuário: ${userId}`);
    } catch (error) {
      this.logger.error(
        `Erro ao invalidar cache de roles: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  /**
   * Invalida o cache de permissões de um role
   */
  async invalidateRolePermissions(roleName: string): Promise<void> {
    const cacheKey = `${this.ROLE_PERMISSIONS_PREFIX}${roleName}`;

    try {
      await this.redisService.delete(cacheKey);

      this.logger.debug(`Cache de permissões invalidado para role: ${roleName}`);
    } catch (error) {
      this.logger.error(
        `Erro ao invalidar cache de permissões: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  /**
   * Invalida o cache de permissões de um usuário
   */
  async invalidateUserPermissions(userId: string): Promise<void> {
    const cacheKey = `user:permissions:${userId}`;

    try {
      await this.redisService.delete(cacheKey);

      this.logger.debug(`Cache de permissões invalidado para usuário: ${userId}`);
    } catch (error) {
      this.logger.error(
        `Erro ao invalidar cache de permissões do usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  /**
   * Invalida todo o cache relacionado a um usuário
   */
  async invalidateUserCache(userId: string): Promise<void> {
    await Promise.all([this.invalidateUserRoles(userId), this.invalidateUserPermissions(userId)]);

    this.logger.debug(`Cache completo invalidado para usuário: ${userId}`);
  }

  /**
   * Invalida todo o cache relacionado a um role
   */
  async invalidateRoleCache(roleName: string): Promise<void> {
    await this.invalidateRolePermissions(roleName);

    this.logger.debug(`Cache completo invalidado para role: ${roleName}`);
  }

  /**
   * Limpa todo o cache de roles e permissões
   */
  async clearAll(): Promise<void> {
    try {
      await this.redisService.clear();

      this.logger.log('Cache de roles e permissões limpo completamente');
    } catch (error) {
      this.logger.error(
        `Erro ao limpar cache: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  /**
   * Verifica se o cache está disponível
   */
  async isCacheAvailable(): Promise<boolean> {
    try {
      await this.redisService.set('health-check', 'ok', 1000);
      await this.redisService.delete('health-check');
      return true;
    } catch {
      this.logger.warn('Cache Redis não disponível');
      return false;
    }
  }
}
