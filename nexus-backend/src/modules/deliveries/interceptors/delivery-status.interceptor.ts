import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { DeliveryStatus, DeliveryStatusTransitions } from '../enums/delivery-status.enum';
import type { UpdateDeliveryStatusBody } from '../interfaces/delivery-status-update.interface';

/**
 * Interceptor para validar e rastrear mudanças de status de entregas
 *
 * Funcionalidades:
 * - Valida transições de status antes da atualização
 * - Registra automaticamente no histórico
 * - Bloqueia transições inválidas
 * - Registra logs de auditoria
 *
 * @class DeliveryStatusInterceptor
 */
@Injectable()
export class DeliveryStatusInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DeliveryStatusInterceptor.name);

  /**
   * Rotas que devem ser interceptadas para validação de status
   */
  private readonly WATCHED_ROUTES = ['/deliveries', '/deliveries/:id', '/deliveries/:id/status'];

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;
    const url = request.url;

    // Só intercepta operações de UPDATE/PATCH
    if (method !== 'PATCH' && method !== 'PUT') {
      return next.handle();
    }

    // Verifica se a rota deve ser interceptada
    const shouldIntercept = this.shouldInterceptRoute(url);
    if (!shouldIntercept) {
      return next.handle();
    }

    const body = request.body as UpdateDeliveryStatusBody;

    // Só valida se houver mudança de status no body
    if (!body?.status) {
      return next.handle();
    }

    const newStatus = body.status;
    const currentStatus = body.current_status;

    // Se não há status atual (primeira atribuição), permite
    if (!currentStatus) {
      this.logger.debug(`Primeira atribuição de status: ${newStatus}`);
      return next.handle();
    }

    // Valida a transição
    const isValidTransition = this.validateStatusTransition(currentStatus, newStatus);

    if (!isValidTransition) {
      const errorMessage = `Transição de status inválida: ${currentStatus} -> ${newStatus}`;
      this.logger.warn(errorMessage);
      throw new BadRequestException({
        message: errorMessage,
        currentStatus,
        attemptedStatus: newStatus,
        allowedTransitions: DeliveryStatusTransitions[currentStatus] || [],
      });
    }

    this.logger.debug(`Transição de status válida: ${currentStatus} -> ${newStatus}`);

    // Continua com a execução e registra após sucesso
    return next.handle().pipe(
      tap(() => {
        this.logger.log(`Status atualizado com sucesso: ${currentStatus} -> ${newStatus}`);
      }),
    );
  }

  /**
   * Valida se uma transição de status é permitida
   *
   * @param fromStatus - Status atual
   * @param toStatus - Status desejado
   * @returns true se a transição é válida
   */
  private validateStatusTransition(fromStatus: DeliveryStatus, toStatus: DeliveryStatus): boolean {
    // Se for o mesmo status, permite (idempotente)
    if (fromStatus === toStatus) {
      return true;
    }

    const allowedTransitions = DeliveryStatusTransitions[fromStatus];

    if (!allowedTransitions) {
      this.logger.warn(`Status desconhecido: ${fromStatus}`);
      return false;
    }

    return allowedTransitions.includes(toStatus);
  }

  /**
   * Verifica se a rota deve ser interceptada
   *
   * @param url - URL da requisição
   * @returns true se deve interceptar
   */
  private shouldInterceptRoute(url: string): boolean {
    return this.WATCHED_ROUTES.some(route => {
      const routePattern = route.replace(':id', '[^/]+');
      const regex = new RegExp(`^${routePattern}$`);
      return regex.test(url.split('?')[0] ?? '');
    });
  }
}
