/**
 * Audit Context Interceptor
 *
 * Interceptor responsável por capturar e propagar o contexto de auditoria
 * usando CLS (Continuation Local Storage) para rastreamento de requisições.
 *
 * Baseado nas melhores práticas de 2025 para NestJS:
 * - Usa ClsService para propagação de contexto assíncrono
 * - Captura metadata de requisições HTTP
 * - Gera request ID único para rastreabilidade
 * - Propaga informações de usuário autenticado
 *
 * @see https://github.com/papooch/nestjs-cls
 * @see https://docs.nestjs.com/interceptors
 */
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { RequestUser, RequestWithUser } from '../interfaces';

@Injectable()
export class AuditContextInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditContextInterceptor.name);

  constructor(private readonly clsService: ClsService) {}

  /**
   * Intercepta a requisição e configura o contexto de auditoria
   *
   * @param context - Contexto de execução do NestJS
   * @param next - Handler para a próxima etapa do pipeline
   * @returns Observable com a resposta da requisição
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    // Gera ou extrai request ID
    const requestId = this.extractRequestId(request);

    // Extrai informações do usuário autenticado (se houver)
    const user = this.extractUser(request);

    // Extrai metadata da requisição
    const ipAddress = this.extractIpAddress(request);
    const userAgent = request.headers['user-agent'];

    // Configura o contexto CLS com todas as informações
    this.clsService.set('requestId', requestId);
    this.clsService.set('userId', user?.id);
    this.clsService.set('userEmail', user?.email);
    this.clsService.set('userRole', user?.role);
    this.clsService.set('ipAddress', ipAddress);
    this.clsService.set('userAgent', userAgent);
    this.clsService.set('timestamp', new Date());
    this.clsService.set('path', request.path);
    this.clsService.set('method', request.method);

    // Log de debug (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(
        `Audit context initialized: ${requestId} | User: ${user?.email ?? 'anonymous'} | ${request.method} ${request.path}`,
      );
    }

    return next.handle();
  }

  /**
   * Extrai ou gera um request ID único
   *
   * Ordem de precedência:
   * 1. Header X-Request-ID
   * 2. Header X-Correlation-ID
   * 3. Gera novo UUID v4
   *
   * @param request - Requisição HTTP Express
   * @returns Request ID
   */
  private extractRequestId(request: RequestWithUser): string {
    const xRequestId = request.headers['x-request-id'];
    const xCorrelationId = request.headers['x-correlation-id'];

    if (xRequestId && typeof xRequestId === 'string') {
      return xRequestId;
    }

    if (xCorrelationId && typeof xCorrelationId === 'string') {
      return xCorrelationId;
    }

    return uuidv4();
  }

  /**
   * Extrai informações do usuário autenticado da requisição
   *
   * @param request - Requisição HTTP Express
   * @returns Objeto com dados do usuário ou undefined
   */
  private extractUser(request: RequestWithUser): RequestUser | undefined {
    // O usuário é injetado pelo AuthGuard/JwtStrategy
    const user = request.user;

    if (!user || typeof user !== 'object') {
      return undefined;
    }

    const userId = user.id ?? user.sub;
    const userEmail = user.email ?? user.username;

    if (!userId || !userEmail) {
      return undefined;
    }

    // Retorna o objeto sem a propriedade role se ela for undefined
    // Isso garante compatibilidade com exactOptionalPropertyTypes: true
    const result: RequestUser = {
      id: userId,
      email: userEmail,
    };

    if (user.role !== undefined) {
      result.role = user.role;
    }

    return result;
  }

  /**
   * Extrai o endereço IP do cliente
   *
   * Considera proxies e load balancers (X-Forwarded-For, X-Real-IP)
   *
   * @param request - Requisição HTTP Express
   * @returns Endereço IP do cliente
   */
  private extractIpAddress(request: RequestWithUser): string {
    // X-Forwarded-For (proxy/load balancer)
    const forwardedFor = request.headers['x-forwarded-for'];

    if (forwardedFor) {
      const ipList = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
      if (typeof ipList === 'string') {
        const firstIp = ipList.split(',')[0]?.trim();
        if (firstIp) {
          return firstIp;
        }
      }
    }

    // X-Real-IP (nginx)
    const realIp = request.headers['x-real-ip'];
    if (realIp) {
      const ip = Array.isArray(realIp) ? realIp[0] : realIp;
      if (typeof ip === 'string') {
        return ip;
      }
    }

    // IP direto da conexão
    if (request.ip) {
      return request.ip;
    }

    // Socket remoteAddress como fallback
    if (request.socket?.remoteAddress) {
      return request.socket.remoteAddress;
    }

    return 'unknown';
  }
}
