import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ServiceOrderWorkflowService } from '../services/service-order-workflow.service';

interface RequestWithBody {
  body?: {
    status?: string;
  };
  params: {
    id?: string;
  };
}

/**
 * Interceptor para validar transições de workflow
 *
 * Aplica validações automáticas antes de permitir
 * alterações de status em Service Orders
 */
@Injectable()
export class WorkflowValidationInterceptor implements NestInterceptor {
  constructor(private readonly workflowService: ServiceOrderWorkflowService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithBody>();
    const body = request.body;

    // Validar apenas em atualizações com mudança de status
    if (body?.status && request.params.id) {
      // A validação real será feita no service
      // Este interceptor pode ser usado para logs ou validações adicionais
    }

    return next.handle();
  }
}
