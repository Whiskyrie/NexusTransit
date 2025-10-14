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
import { DriverStatus } from '../enums/driver-status.enum';
import { UpdateDriverStatusBody } from '../interfaces/driver-status-update.interface';

/**
 * Mapa de transições válidas de status para motoristas
 */
export const DriverStatusTransitions: Record<DriverStatus, DriverStatus[]> = {
  [DriverStatus.AVAILABLE]: [
    DriverStatus.ON_ROUTE,
    DriverStatus.UNAVAILABLE,
    DriverStatus.VACATION,
    DriverStatus.BLOCKED,
  ],
  [DriverStatus.ON_ROUTE]: [DriverStatus.AVAILABLE, DriverStatus.UNAVAILABLE],
  [DriverStatus.UNAVAILABLE]: [DriverStatus.AVAILABLE, DriverStatus.VACATION, DriverStatus.BLOCKED],
  [DriverStatus.BLOCKED]: [DriverStatus.AVAILABLE, DriverStatus.UNAVAILABLE],
  [DriverStatus.VACATION]: [DriverStatus.AVAILABLE, DriverStatus.UNAVAILABLE],
};

/**
 * Interceptor para validar e rastrear mudanças de status de motoristas
 *
 * Funcionalidades:
 * - Valida transições de status antes da atualização
 * - Registra automaticamente no histórico
 * - Bloqueia transições inválidas
 * - Registra logs de auditoria
 *
 * @class DriverStatusInterceptor
 */
@Injectable()
export class DriverStatusInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DriverStatusInterceptor.name);

  /**
   * Rotas que devem ser interceptadas para validação de status
   */
  private readonly WATCHED_ROUTES = ['/drivers', '/drivers/:id', '/drivers/:id/status'];

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

    const body = request.body as UpdateDriverStatusBody;

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
        allowedTransitions: DriverStatusTransitions[currentStatus] || [],
      });
    }

    this.logger.debug(`Transição de status válida: ${currentStatus} -> ${newStatus}`);

    // Continua com a execução e registra após sucesso
    return next.handle().pipe(
      tap(() => {
        this.logger.log(`Status do motorista atualizado: ${currentStatus} -> ${newStatus}`);
        this.logStatusChangeDetails(currentStatus, newStatus);
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
  private validateStatusTransition(fromStatus: DriverStatus, toStatus: DriverStatus): boolean {
    // Se for o mesmo status, permite (idempotente)
    if (fromStatus === toStatus) {
      return true;
    }

    const allowedTransitions = DriverStatusTransitions[fromStatus];

    if (!allowedTransitions) {
      this.logger.warn(`Status origem desconhecido: ${fromStatus}`);
      return false;
    }

    return allowedTransitions.includes(toStatus);
  }

  /**
   * Verifica se a rota deve ser interceptada
   */
  private shouldInterceptRoute(url: string): boolean {
    return this.WATCHED_ROUTES.some(route => {
      const pattern = route.replace(':id', '[^/]+');
      const regex = new RegExp(`^${pattern}(?:\\?.*)?$`);
      return regex.test(url);
    });
  }

  /**
   * Registra detalhes adicionais sobre a mudança de status
   */
  private logStatusChangeDetails(fromStatus: DriverStatus, toStatus: DriverStatus): void {
    // Casos especiais que merecem atenção
    if (toStatus === DriverStatus.BLOCKED) {
      this.logger.warn(
        `Motorista bloqueado. Status anterior: ${fromStatus}. Verificar motivo do bloqueio.`,
      );
    }

    if (toStatus === DriverStatus.ON_ROUTE && fromStatus !== DriverStatus.AVAILABLE) {
      this.logger.warn(
        `Motorista iniciou rota de status ${fromStatus}. Esperado: ${DriverStatus.AVAILABLE}`,
      );
    }

    if (fromStatus === DriverStatus.ON_ROUTE && toStatus !== DriverStatus.AVAILABLE) {
      this.logger.warn(
        `Motorista saiu de rota para status ${toStatus}. Esperado: ${DriverStatus.AVAILABLE}`,
      );
    }
  }
}
