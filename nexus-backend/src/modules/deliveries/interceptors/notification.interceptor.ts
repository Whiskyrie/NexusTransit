import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { NotificationType } from '../interfaces/notification.interface';
import type { NotificationPayload } from '../interfaces/notification-payload.interface';

/**
 * Interceptor para disparar notificações automáticas em eventos de entregas
 *
 * Funcionalidades:
 * - Detecta eventos importantes em entregas
 * - Enfileira notificações assíncronas
 * - Filtra notificações por tipo
 * - Não bloqueia a resposta da requisição
 *
 * @class NotificationInterceptor
 */
@Injectable()
export class NotificationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(NotificationInterceptor.name);

  /**
   * Mapeamento de métodos HTTP e rotas para tipos de notificação
   */
  private readonly NOTIFICATION_TRIGGERS = new Map<
    string,
    { method: string; pattern: RegExp; type: NotificationType }
  >([
    [
      'create-delivery',
      {
        method: 'POST',
        pattern: /^\/deliveries$/,
        type: NotificationType.DELIVERY_CREATED,
      },
    ],
    [
      'update-status',
      {
        method: 'PATCH',
        pattern: /^\/deliveries\/[^/]+\/status$/,
        type: NotificationType.STATUS_CHANGE,
      },
    ],
    [
      'assign-driver',
      {
        method: 'PATCH',
        pattern: /^\/deliveries\/[^/]+\/assign$/,
        type: NotificationType.ASSIGNMENT,
      },
    ],
  ]);
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;
    const url = request.url.split('?')[0] ?? '';

    // Identifica o tipo de notificação
    const notificationType = this.identifyNotificationType(method, url);

    if (!notificationType) {
      return next.handle();
    }

    // Continua com a execução e dispara notificação após sucesso
    return next.handle().pipe(
      tap(response => {
        this.enqueueNotification(notificationType, request, response);
      }),
    );
  }

  /**
   * Identifica o tipo de notificação baseado na rota e método
   *
   * @param method - Método HTTP
   * @param url - URL da requisição
   * @returns Tipo de notificação ou null
   */
  private identifyNotificationType(method: string, url: string): NotificationType | null {
    for (const trigger of this.NOTIFICATION_TRIGGERS.values()) {
      if (trigger.method === method && trigger.pattern.test(url)) {
        return trigger.type;
      }
    }
    return null;
  }

  /**
   * Enfileira uma notificação para processamento assíncrono
   *
   * @param type - Tipo de notificação
   * @param request - Request do Express
   * @param response - Resposta da operação
   */
  private enqueueNotification(type: NotificationType, request: unknown, response: unknown): void {
    try {
      const payload = this.buildNotificationPayload(type, request, response);

      // TODO: Integrar com serviço de notificações (queue)
      this.logger.debug(`Notificação enfileirada: ${type}`, JSON.stringify(payload, null, 2));

      // Aqui seria feita a integração com:
      // - Bull Queue
      // - Redis Pub/Sub
      // - RabbitMQ
      // - AWS SQS
      // etc.
    } catch (error) {
      this.logger.error(
        `Erro ao enfileirar notificação: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Não propaga o erro para não afetar a resposta
    }
  }

  /**
   * Constrói o payload da notificação
   *
   * @param type - Tipo de notificação
   * @param request - Request do Express
   * @param response - Resposta da operação
   * @returns Payload de notificação
   */
  private buildNotificationPayload(
    type: NotificationType,
    request: unknown,
    response: unknown,
  ): NotificationPayload {
    const payload: NotificationPayload = {
      type,
      metadata: {},
    };

    // Extrai IDs relevantes do response
    if (response && typeof response === 'object') {
      const data = response as Record<string, unknown>;

      if ('id' in data && typeof data.id === 'string') {
        payload.deliveryId = data.id;
      }

      if ('customer_id' in data && typeof data.customer_id === 'string') {
        payload.customerId = data.customer_id;
      }

      if ('driver_id' in data && typeof data.driver_id === 'string') {
        payload.driverId = data.driver_id;
      }

      // Adiciona metadata adicional baseado no tipo
      if (type === NotificationType.STATUS_CHANGE && 'status' in data) {
        payload.metadata = {
          ...payload.metadata,
          newStatus: data.status,
        };
      }
    }

    // Extrai user ID do request (se autenticado)
    if (request && typeof request === 'object' && 'user' in request) {
      const user = request.user as Record<string, unknown> | undefined;
      if (user && 'id' in user && typeof user.id === 'string') {
        payload.userId = user.id;
      }
    }

    return payload;
  }
}
