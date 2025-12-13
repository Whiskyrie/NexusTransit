/**
 * Route Status Interceptor
 *
 * Interceptor responsável por validar transições de status de rotas
 * antes que a operação seja executada.
 *
 * Implementa regras de negócio para:
 * - Transições válidas entre status
 * - Validações específicas por status
 * - Logs de mudanças de status
 *
 * @module Routes
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { RouteStatus } from '../enums/route-status';
import { VALID_STATUS_TRANSITIONS } from '../constants';

/**
 * Interface para requisição com body
 */
interface RequestWithBody {
  method: string;
  path: string;
  body?: {
    status?: unknown;
    [key: string]: unknown;
  };
}

@Injectable()
export class RouteStatusInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RouteStatusInterceptor.name);

  /**
   * Intercepta a requisição e valida transições de status
   *
   * @param context - Contexto de execução do NestJS
   * @param next - Handler para a próxima etapa do pipeline
   * @returns Observable com a resposta da requisição
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithBody>();
    const { status } = request.body ?? {};

    // Se não há mudança de status, prossegue normalmente
    if (!status) {
      return next.handle();
    }

    // Valida se o status fornecido é válido
    if (typeof status !== 'string' || !this.isValidStatus(status)) {
      const statusStr = typeof status === 'string' ? status : JSON.stringify(status);
      throw new BadRequestException(
        `Status inválido: ${statusStr}. Status válidos: ${Object.values(RouteStatus).join(', ')}`,
      );
    }

    // Aqui poderíamos buscar o status atual da rota do banco
    // Mas isso seria feito no service, este interceptor valida apenas a entrada

    // Log de debug
    this.logger.debug(`Status change requested: ${status} | ${request.method} ${request.path}`);

    return next.handle();
  }

  /**
   * Valida se um status está entre os valores permitidos
   *
   * @param status - Status a ser validado
   * @returns true se o status é válido
   */
  private isValidStatus(status: string): status is RouteStatus {
    return Object.values(RouteStatus).includes(status as RouteStatus);
  }

  /**
   * Valida se uma transição de status é permitida
   *
   * Método público para ser usado pelos services
   *
   * @param currentStatus - Status atual da rota
   * @param newStatus - Novo status desejado
   * @returns true se a transição é válida
   */
  static isValidTransition(currentStatus: RouteStatus, newStatus: RouteStatus): boolean {
    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] ?? [];
    return allowedTransitions.includes(newStatus);
  }

  /**
   * Obtém a lista de transições válidas para um status
   *
   * @param currentStatus - Status atual
   * @returns Array de status permitidos
   */
  static getValidTransitions(currentStatus: RouteStatus): RouteStatus[] {
    return VALID_STATUS_TRANSITIONS[currentStatus] ?? [];
  }
}
