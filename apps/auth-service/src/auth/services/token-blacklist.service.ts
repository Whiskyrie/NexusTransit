import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { RedisService } from '../../redis/redis.service';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);
  private readonly BLACKLIST_PREFIX = 'blacklist';

  constructor(
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Adiciona um token à blacklist
   */
  async addToBlacklist(token: string): Promise<boolean> {
    try {
      // Decodifica o token para obter o tempo de expiração
      const decoded = this.jwtService.decode<JwtPayload>(token);

      if (!decoded?.exp) {
        this.logger.warn('Token inválido ou sem tempo de expiração');
        return false;
      }

      // Calcula o TTL baseado no tempo de expiração do token
      const now = Math.floor(Date.now() / 1000);
      const ttl = decoded.exp - now;

      // Se o token já expirou, não precisa adicionar à blacklist
      if (ttl <= 0) {
        this.logger.debug('Token já expirado, não adicionado à blacklist');
        return true;
      }

      // Usa o JTI (se disponível) ou o hash do token como chave
      const tokenId = decoded.jti ?? this.generateTokenHash(token);
      const key = `${this.BLACKLIST_PREFIX}:${tokenId}`;

      // Adiciona à blacklist com TTL
      const success = await this.redisService.set(
        key,
        {
          blacklistedAt: new Date().toISOString(),
          userId: decoded.sub,
          reason: 'logout',
        },
        ttl,
      );

      if (success) {
        this.logger.log(`Token adicionado à blacklist: ${tokenId}`);
      } else {
        this.logger.error(`Falha ao adicionar token à blacklist: ${tokenId}`);
      }

      return success;
    } catch (error) {
      this.logger.error('Erro ao adicionar token à blacklist', error);
      return false;
    }
  }

  /**
   * Verifica se um token está na blacklist
   */
  async isBlacklisted(token: string): Promise<boolean> {
    try {
      const decoded = this.jwtService.decode<JwtPayload>(token);

      if (!decoded) {
        this.logger.warn('Token inválido para verificação de blacklist');
        return true; // Considera inválido como blacklisted
      }

      const tokenId = decoded.jti ?? this.generateTokenHash(token);
      const key = `${this.BLACKLIST_PREFIX}:${tokenId}`;

      const isBlacklisted = await this.redisService.has(key);

      if (isBlacklisted) {
        this.logger.debug(`Token encontrado na blacklist: ${tokenId}`);
      }

      return isBlacklisted;
    } catch (error) {
      this.logger.error('Erro ao verificar blacklist', error);
      return true; // Em caso de erro, considera como blacklisted por segurança
    }
  }

  /**
   * Remove um token da blacklist (usado para testes ou casos especiais)
   */
  async removeFromBlacklist(token: string): Promise<boolean> {
    try {
      const decoded = this.jwtService.decode<JwtPayload>(token);

      if (!decoded) {
        return false;
      }

      const tokenId = decoded.jti ?? this.generateTokenHash(token);
      const key = `${this.BLACKLIST_PREFIX}:${tokenId}`;

      return await this.redisService.delete(key);
    } catch (error) {
      this.logger.error('Erro ao remover token da blacklist', error);
      return false;
    }
  }

  /**
   * Invalida todos os tokens de um usuário específico
   */
  async blacklistAllUserTokens(userId: string): Promise<boolean> {
    try {
      // Esta é uma implementação simplificada
      // Em um ambiente de produção, você poderia manter uma lista de tokens por usuário
      const key = `${this.BLACKLIST_PREFIX}:user:${userId}`;
      const success = await this.redisService.set(
        key,
        {
          blacklistedAt: new Date().toISOString(),
          reason: 'user_tokens_revoked',
        },
        this.getDefaultTTL(),
      );

      if (success) {
        this.logger.log(`Todos os tokens do usuário ${userId} foram invalidados`);
      }

      return success;
    } catch (error) {
      this.logger.error('Erro ao invalidar tokens do usuário', error);
      return false;
    }
  }

  /**
   * Verifica se todos os tokens de um usuário foram invalidados
   */
  async areUserTokensBlacklisted(userId: string): Promise<boolean> {
    try {
      const key = `${this.BLACKLIST_PREFIX}:user:${userId}`;
      return await this.redisService.has(key);
    } catch (error) {
      this.logger.error('Erro ao verificar invalidação de tokens do usuário', error);
      return false;
    }
  }

  /**
   * Limpa a blacklist (apenas para testes)
   */
  async clearBlacklist(): Promise<void> {
    try {
      // Nota: Keyv clear() limpa todo o namespace, use com cuidado
      await this.redisService.clear();
      this.logger.log('Blacklist limpa');
    } catch (error) {
      this.logger.error('Erro ao limpar blacklist', error);
    }
  }

  /**
   * Gera um hash único para o token
   */
  private generateTokenHash(token: string): string {
    return createHash('sha256').update(token).digest('hex').substring(0, 32);
  }

  /**
   * Obtém o TTL padrão para tokens na blacklist
   */
  private getDefaultTTL(): number {
    // Usa o TTL do refresh token como padrão (7 dias em segundos)
    return 7 * 24 * 60 * 60; // 7 dias
  }
}
