import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { AuditLogService } from '../audit-log.service';
import { AuditAction, AuditCategory } from '../enums';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    roles?: { name: string }[];
  };
}

interface AuditData {
  action: AuditAction;
  category: AuditCategory;
  userId: string | null;
  userEmail: string | null;
  userRole: string | null;
  resourceType: string;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestMethod: string;
  requestUrl: string;
  metadata: Record<string, unknown>;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Skip audit for health check and static files
    if (this.shouldSkipAudit(request.url)) {
      return next.handle();
    }

    const auditData = this.extractAuditData(request);

    return next.handle().pipe(
      tap(() => {
        const executionTime = Date.now() - startTime;
        void this.logSuccess(auditData, response, executionTime);
      }),
      catchError(error => {
        const executionTime = Date.now() - startTime;
        void this.logError(auditData, response, error as Error, executionTime);
        throw error;
      }),
    );
  }

  private shouldSkipAudit(url: string): boolean {
    const skipPatterns = ['/health', '/favicon.ico', '/robots.txt', '/swagger', '/docs'];
    return skipPatterns.some(pattern => url.includes(pattern));
  }

  private extractAuditData(request: RequestWithUser): AuditData {
    const method = request.method;
    const url = request.url;
    const userAgent = request.get('User-Agent') ?? null;
    const ipAddress = this.getClientIp(request);

    // Extract user information
    const user = request.user;
    const userId = user?.id ?? null;
    const userEmail = user?.email ?? null;
    const userRole = user?.roles?.[0]?.name ?? null;

    // Determine action based on HTTP method
    const action = this.getAuditAction(method);

    // Determine category based on URL
    const category = this.getAuditCategory(url);

    // Extract resource information
    const { resourceType, resourceId } = this.extractResourceInfo(url);

    return {
      action,
      category,
      userId,
      userEmail,
      userRole,
      resourceType,
      resourceId,
      ipAddress,
      userAgent,
      requestMethod: method,
      requestUrl: url,
      metadata: {
        headers: this.sanitizeHeaders(request.headers),
        query: request.query,
        params: request.params,
      },
    };
  }

  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ??
      (request.headers['x-real-ip'] as string) ??
      request.socket.remoteAddress ??
      'unknown'
    );
  }

  private getAuditAction(method: string): AuditAction {
    switch (method.toUpperCase()) {
      case 'POST':
        return AuditAction.CREATE;
      case 'GET':
        return AuditAction.READ;
      case 'PUT':
      case 'PATCH':
        return AuditAction.UPDATE;
      case 'DELETE':
        return AuditAction.DELETE;
      default:
        return AuditAction.READ;
    }
  }

  private getAuditCategory(url: string): AuditCategory {
    if (url.includes('/auth')) {
      return AuditCategory.AUTH;
    }
    if (url.includes('/users')) {
      return AuditCategory.USER_MANAGEMENT;
    }
    if (url.includes('/vehicles')) {
      return AuditCategory.VEHICLE_MANAGEMENT;
    }
    if (url.includes('/routes')) {
      return AuditCategory.ROUTE_MANAGEMENT;
    }
    if (url.includes('/deliveries')) {
      return AuditCategory.DELIVERY_MANAGEMENT;
    }
    if (url.includes('/customers')) {
      return AuditCategory.CUSTOMER_MANAGEMENT;
    }
    if (url.includes('/drivers')) {
      return AuditCategory.DRIVER_MANAGEMENT;
    }
    if (url.includes('/incidents')) {
      return AuditCategory.INCIDENT_MANAGEMENT;
    }

    return AuditCategory.SYSTEM;
  }

  private extractResourceInfo(url: string): { resourceType: string; resourceId: string | null } {
    const segments = url.split('/').filter(Boolean);

    if (segments.length >= 2) {
      const resourceType = segments[1] ?? 'unknown';
      const resourceId = segments[2] ?? null;

      return { resourceType, resourceId };
    }

    return { resourceType: 'unknown', resourceId: null };
  }

  private sanitizeHeaders(headers: Record<string, unknown>): Record<string, unknown> {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    const sanitized = { ...headers };

    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private async logSuccess(
    auditData: AuditData,
    response: Response,
    executionTime: number,
  ): Promise<void> {
    try {
      const logData = {
        action: auditData.action,
        category: auditData.category,
        resourceType: auditData.resourceType,
        statusCode: response.statusCode,
        executionTimeMs: executionTime,
        description: `${auditData.action} operation on ${auditData.resourceType}`,
        ...(auditData.userId && { userId: auditData.userId }),
        ...(auditData.userEmail && { userEmail: auditData.userEmail }),
        ...(auditData.userRole && { userRole: auditData.userRole }),
        ...(auditData.resourceId && { resourceId: auditData.resourceId }),
        ...(auditData.ipAddress && { ipAddress: auditData.ipAddress }),
        ...(auditData.userAgent && { userAgent: auditData.userAgent }),
        requestMethod: auditData.requestMethod,
        requestUrl: auditData.requestUrl,
        metadata: auditData.metadata,
      };

      await this.auditLogService.createLog(logData);
    } catch (error) {
      this.logger.error(`Failed to log audit success: ${String(error)}`);
    }
  }

  private async logError(
    auditData: AuditData,
    response: Response,
    error: Error,
    executionTime: number,
  ): Promise<void> {
    try {
      const logData = {
        action: auditData.action,
        category: auditData.category,
        resourceType: auditData.resourceType,
        statusCode: response.statusCode ?? 500,
        executionTimeMs: executionTime,
        description: `Failed ${auditData.action} operation on ${auditData.resourceType}: ${error.message}`,
        ...(auditData.userId && { userId: auditData.userId }),
        ...(auditData.userEmail && { userEmail: auditData.userEmail }),
        ...(auditData.userRole && { userRole: auditData.userRole }),
        ...(auditData.resourceId && { resourceId: auditData.resourceId }),
        ...(auditData.ipAddress && { ipAddress: auditData.ipAddress }),
        ...(auditData.userAgent && { userAgent: auditData.userAgent }),
        requestMethod: auditData.requestMethod,
        requestUrl: auditData.requestUrl,
        metadata: {
          ...auditData.metadata,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        },
      };

      await this.auditLogService.createLog(logData);
    } catch (auditError) {
      this.logger.error(`Failed to log audit error: ${String(auditError)}`);
    }
  }
}
