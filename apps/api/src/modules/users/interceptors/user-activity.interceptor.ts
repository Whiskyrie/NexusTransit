import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { User } from '../entities/user.entity';

/**
 * Interface para request com usuário autenticado
 */
interface AuthenticatedRequest extends Request {
  user?: Pick<User, 'id'>;
}

/**
 * Intervalo mínimo entre atualizações de atividade (em ms)
 * Evita múltiplas escritas no banco para requisições em sequência
 */
const ACTIVITY_UPDATE_THROTTLE_MS = 60_000; // 1 minuto

/**
 * Cache em memória para throttle de atualizações
 */
const lastActivityUpdateCache = new Map<string, number>();

/**
 * Interceptor para rastrear atividade do usuário
 *
 * Atualiza automaticamente o campo `last_activity_at` quando o usuário
 * faz requisições autenticadas
 *
 * Como usar:
 * 1. Aplicar globalmente no módulo
 * 2. Aplicar em controllers específicos com @UseInterceptors()
 * 3. Aplicar em rotas específicas com @UseInterceptors()
 *
 * @example
 * // No controller
 * @UseInterceptors(UserActivityInterceptor)
 * @Controller('users')
 * export class UsersController {}
 *
 * @example
 * // Em uma rota específica
 * @Get('profile')
 * @UseInterceptors(UserActivityInterceptor)
 * getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 */
@Injectable()
export class UserActivityInterceptor implements NestInterceptor {
  private readonly logger = new Logger(UserActivityInterceptor.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Intercepta a requisição e atualiza atividade do usuário
   *
   * @param context - Contexto de execução
   * @param next - Handler da requisição
   * @returns Observable com a resposta
   */
  intercept(context: ExecutionContext, next: CallHandler<unknown>): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.id;

    // Se há um usuário autenticado, atualizar atividade
    if (userId && this.shouldUpdateActivity(userId)) {
      // Atualizar de forma assíncrona (não bloqueia a requisição)
      this.updateLastActivity(userId).catch((error: Error) => {
        this.logger.error(`Erro ao atualizar atividade do usuário ${userId}: ${error.message}`);
      });
    }

    return next.handle().pipe(
      tap({
        next: (): void => {
          if (userId) {
            this.logger.debug(`Atividade registrada para usuário: ${userId}`);
          }
        },
        error: (error: Error): void => {
          this.logger.debug(
            `Erro na requisição do usuário ${userId ?? 'anônimo'}: ${error.message}`,
          );
        },
      }),
    );
  }

  /**
   * Verifica se deve atualizar a atividade do usuário
   * Implementa throttle para evitar múltiplas escritas
   *
   * @param userId - ID do usuário
   * @returns true se deve atualizar
   */
  private shouldUpdateActivity(userId: string): boolean {
    const now = Date.now();
    const lastUpdate = lastActivityUpdateCache.get(userId);

    if (lastUpdate && now - lastUpdate < ACTIVITY_UPDATE_THROTTLE_MS) {
      return false;
    }

    lastActivityUpdateCache.set(userId, now);
    return true;
  }

  /**
   * Atualiza o campo last_activity_at do usuário
   *
   * Executa de forma assíncrona para não bloquear a requisição
   *
   * @param userId - ID do usuário
   */
  private async updateLastActivity(userId: string): Promise<void> {
    try {
      await this.userRepository.update(userId, {
        last_activity_at: new Date(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      // Não propagar erro - apenas logar
      this.logger.error(`Falha ao atualizar last_activity_at para usuário ${userId}: ${message}`);
    }
  }
}
