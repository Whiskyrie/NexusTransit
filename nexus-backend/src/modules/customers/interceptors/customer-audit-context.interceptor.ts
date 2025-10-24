import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ClsService } from 'nestjs-cls';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RequestUser } from '../interfaces/request-user.interface';
import { RequestBody } from '../interfaces/request-body.interface';

/**
 * Interceptor para configurar contexto de auditoria específico para operações com clientes
 *
 * Extrai e propaga informações do usuário e da requisição para o contexto de auditoria
 * Adiciona metadados específicos do módulo customers
 *
 * @class CustomerAuditContextInterceptor
 */
@Injectable()
export class CustomerAuditContextInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CustomerAuditContextInterceptor.name);

  constructor(private readonly clsService: ClsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();

    try {
      // Generate or extract request ID
      const requestId: string = request.get('x-request-id') ?? uuidv4();

      // Extract user information (assuming it's set by auth guard)
      const user = request.user as RequestUser | undefined;

      // Extract request metadata
      const ipAddress = this.extractIpAddress(request);
      const userAgentHeader = request.headers['user-agent'];
      const userAgent = typeof userAgentHeader === 'string' ? userAgentHeader : 'Unknown';

      // Extract customer-specific context
      const customerId = this.extractCustomerId(request);
      const operation = this.extractOperation(request);

      // Set basic context in CLS
      (this.clsService.set as (key: string, value: unknown) => void)('requestId', requestId);
      this.clsService.set('userId', user?.id);
      this.clsService.set('userEmail', user?.email);
      this.clsService.set('userName', user?.name);
      this.clsService.set('userRoles', user?.roles);
      this.clsService.set('ipAddress', ipAddress);
      this.clsService.set('userAgent', userAgent);
      this.clsService.set('method', request.method);
      this.clsService.set('url', request.url);
      this.clsService.set('timestamp', new Date().toISOString());

      // Set customer-specific context
      this.clsService.set('customerId', customerId);
      this.clsService.set('operation', operation);
      this.clsService.set('module', 'customers');

      // Add request ID to response headers
      const response = context.switchToHttp().getResponse<Response>();
      response.setHeader('X-Request-ID', requestId);

      this.logger.debug(
        `Contexto de auditoria customers configurado - Request: ${requestId}, User: ${user?.id ?? 'ANONYMOUS'}, Customer: ${customerId ?? 'N/A'}, Operation: ${operation}`,
      );
    } catch (error) {
      this.logger.error('Erro ao configurar contexto de auditoria customers:', error);
      // Continue execution even if audit context setup fails
    }

    return next.handle();
  }

  /**
   * Extrai o IP address da requisição considerando proxies
   */
  private extractIpAddress(request: Request): string {
    const forwardedFor = request.get('x-forwarded-for');
    const realIp = request.get('x-real-ip');

    return (
      (forwardedFor ? forwardedFor.split(',')[0] : undefined) ??
      realIp ??
      request.socket?.remoteAddress ??
      '0.0.0.0'
    );
  }

  /**
   * Extrai o ID do cliente da requisição (se disponível)
   */
  private extractCustomerId(request: Request): string | undefined {
    // Extrair de parâmetros de rota (ex: /customers/:id)
    if (request.params && typeof request.params.id === 'string') {
      return request.params.id;
    }

    // Extrair do query string (ex: ?customerId=xxx)
    if (request.query && typeof request.query.customerId === 'string') {
      return request.query.customerId;
    }

    // Extrair do body (para operações de criação/atualização)
    const body = request.body as RequestBody;
    if (body && typeof body.customerId === 'string') {
      return body.customerId;
    }

    return undefined;
  }

  /**
   * Extrai a tipo de operação baseada no método e URL
   */
  private extractOperation(request: Request): string {
    const method = request.method;
    const url = request.url;

    // Operações CRUD básicas
    if (url.includes('/customers')) {
      if (method === 'POST') {
        return 'CREATE_CUSTOMER';
      }
      if (method === 'GET' && url.includes('/addresses')) {
        return 'LIST_ADDRESSES';
      }
      if (method === 'POST' && url.includes('/addresses')) {
        return 'CREATE_ADDRESS';
      }
      if (method === 'GET' && url.includes('/contacts')) {
        return 'LIST_CONTACTS';
      }
      if (method === 'POST' && url.includes('/contacts')) {
        return 'CREATE_CONTACT';
      }
      if (method === 'GET' && url.includes('/preferences')) {
        return 'GET_PREFERENCES';
      }
      if (method === 'PATCH' && url.includes('/preferences')) {
        return 'UPDATE_PREFERENCES';
      }
      if (method === 'GET' && request.params?.id) {
        return 'GET_CUSTOMER';
      }
      if (method === 'PATCH' && request.params?.id) {
        return 'UPDATE_CUSTOMER';
      }
      if (method === 'DELETE' && request.params?.id) {
        return 'DELETE_CUSTOMER';
      }
    }

    // Operação genérica baseada no método
    switch (method) {
      case 'GET':
        return 'READ';
      case 'POST':
        return 'CREATE';
      case 'PATCH':
      case 'PUT':
        return 'UPDATE';
      case 'DELETE':
        return 'DELETE';
      default:
        return 'UNKNOWN';
    }
  }
}
