import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { CustomerStatus } from '../enums/customer-status.enum';

interface CustomerRequest extends Request {
  body: {
    status?: CustomerStatus;
    type?: string;
    taxId?: string;
    email?: string;
  };
}

/**
 * Interceptor para validação de status do cliente
 *
 * Valida operações baseadas no status do cliente
 * Previne ações não permitidas para clientes inativos/bloqueados
 *
 * @class CustomerStatusInterceptor
 */
@Injectable()
export class CustomerStatusInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CustomerStatusInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<CustomerRequest>();
    const { method, body } = request;

    // Validar mudanças de status
    if (method === 'PATCH' || method === 'PUT') {
      if (body.status) {
        this.validateStatusTransition(body);
      }
    }

    // Validar criação de cliente
    if (method === 'POST') {
      this.validateCustomerCreation(body);
    }

    return next.handle();
  }

  /**
   * Valida transição de status
   */
  private validateStatusTransition(body: { status?: CustomerStatus }): void {
    const newStatus = body.status;

    if (!newStatus) {
      return;
    }

    // Validar se o status é válido
    if (!Object.values(CustomerStatus).includes(newStatus)) {
      throw new BadRequestException(`Invalid customer status: ${newStatus}`);
    }

    this.logger.debug(`Status transition requested: → ${newStatus}`);
  }

  /**
   * Valida criação de cliente
   */
  private validateCustomerCreation(body: {
    status?: CustomerStatus;
    type?: string;
    taxId?: string;
    email?: string;
  }): void {
    // Validar que novos clientes comecem como PROSPECT ou ACTIVE
    if (body.status) {
      if (body.status !== CustomerStatus.PROSPECT && body.status !== CustomerStatus.ACTIVE) {
        throw new BadRequestException('New customers must start with PROSPECT or ACTIVE status');
      }
    }

    // Validar campos obrigatórios
    if (!body.taxId) {
      throw new BadRequestException('Tax ID is required');
    }

    if (!body.email) {
      throw new BadRequestException('Email is required');
    }

    if (!body.type) {
      throw new BadRequestException('Customer type is required');
    }

    this.logger.debug(`Customer creation validated: ${body.email}`);
  }
}
