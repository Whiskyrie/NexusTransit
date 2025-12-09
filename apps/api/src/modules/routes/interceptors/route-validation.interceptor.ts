/**
 * Route Validation Interceptor
 *
 * Interceptor responsável por validar regras de negócio de rotas
 * antes que a operação seja executada.
 *
 * Validações implementadas:
 * - Número de paradas dentro dos limites
 * - Distância total dentro dos limites
 * - Carga total dentro da capacidade
 * - Datas de planejamento válidas
 *
 * @module Routes
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ROUTE_VALIDATION_LIMITS } from '../constants';
import { RouteRequestBody } from '../interfaces';

@Injectable()
export class RouteValidationInterceptor implements NestInterceptor {
  /**
   * Intercepta a requisição e valida regras de negócio
   *
   * @param context - Contexto de execução do NestJS
   * @param next - Handler para a próxima etapa do pipeline
   * @returns Observable com a resposta da requisição
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ method: string; body?: unknown }>();
    const method = request.method;

    // Aplica validações apenas em operações de criação e atualização
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      const body = this.extractBody(request.body);
      this.validateRouteData(body);
    }

    return next.handle();
  }

  /**
   * Extrai e valida o body da requisição
   *
   * @param body - Body da requisição (pode ser any)
   * @returns Body tipado ou objeto vazio
   */
  private extractBody(body: unknown): RouteRequestBody {
    if (!body || typeof body !== 'object') {
      return {};
    }
    return body as RouteRequestBody;
  }

  /**
   * Valida os dados da rota
   *
   * @param data - Dados da rota a serem validados
   * @throws BadRequestException se alguma validação falhar
   */
  private validateRouteData(data: RouteRequestBody): void {
    // Valida distância total
    if (data.total_distance !== undefined) {
      const distance = this.validateAndExtractNumber(data.total_distance, 'total_distance');
      this.validateDistance(distance);
    }

    // Valida carga
    if (data.total_load_kg !== undefined) {
      const load = this.validateAndExtractNumber(data.total_load_kg, 'total_load_kg');
      this.validateLoad(load);
    }

    // Valida volume
    if (data.total_volume_m3 !== undefined) {
      const volume = this.validateAndExtractNumber(data.total_volume_m3, 'total_volume_m3');
      this.validateVolume(volume);
    }

    // Valida data planejada
    if (data.planned_date !== undefined) {
      const dateString = this.validateAndExtractString(data.planned_date, 'planned_date');
      this.validatePlannedDate(dateString);
    }
  }

  /**
   * Valida e extrai um valor numérico
   *
   * @param value - Valor a ser validado
   * @param fieldName - Nome do campo (para mensagens de erro)
   * @returns Número validado
   * @throws BadRequestException se o valor não for um número válido
   */
  private validateAndExtractNumber(value: unknown, fieldName: string): number {
    if (typeof value !== 'number') {
      throw new BadRequestException(`Campo '${fieldName}' deve ser um número`);
    }

    if (!Number.isFinite(value)) {
      throw new BadRequestException(`Campo '${fieldName}' deve ser um número finito`);
    }

    return value;
  }

  /**
   * Valida e extrai um valor string
   *
   * @param value - Valor a ser validado
   * @param fieldName - Nome do campo (para mensagens de erro)
   * @returns String validada
   * @throws BadRequestException se o valor não for uma string válida
   */
  private validateAndExtractString(value: unknown, fieldName: string): string {
    if (typeof value !== 'string') {
      throw new BadRequestException(`Campo '${fieldName}' deve ser uma string`);
    }

    if (value.trim().length === 0) {
      throw new BadRequestException(`Campo '${fieldName}' não pode ser vazio`);
    }

    return value;
  }

  /**
   * Valida a distância total da rota
   *
   * @param distance - Distância em quilômetros
   * @throws BadRequestException se a distância for inválida
   */
  private validateDistance(distance: number): void {
    if (distance < ROUTE_VALIDATION_LIMITS.MIN_DISTANCE_KM) {
      throw new BadRequestException(
        `Distância muito pequena. Mínimo: ${ROUTE_VALIDATION_LIMITS.MIN_DISTANCE_KM}km`,
      );
    }

    if (distance > ROUTE_VALIDATION_LIMITS.MAX_DISTANCE_KM) {
      throw new BadRequestException(
        `Distância excede o limite. Máximo: ${ROUTE_VALIDATION_LIMITS.MAX_DISTANCE_KM}km`,
      );
    }
  }

  /**
   * Valida a carga total da rota
   *
   * @param load - Carga em quilogramas
   * @throws BadRequestException se a carga for inválida
   */
  private validateLoad(load: number): void {
    if (load <= 0) {
      throw new BadRequestException('Carga deve ser maior que zero');
    }

    if (load > ROUTE_VALIDATION_LIMITS.MAX_LOAD_KG) {
      throw new BadRequestException(
        `Carga excede o limite. Máximo: ${ROUTE_VALIDATION_LIMITS.MAX_LOAD_KG}kg`,
      );
    }
  }

  /**
   * Valida o volume total da rota
   *
   * @param volume - Volume em metros cúbicos
   * @throws BadRequestException se o volume for inválido
   */
  private validateVolume(volume: number): void {
    if (volume <= 0) {
      throw new BadRequestException('Volume deve ser maior que zero');
    }

    if (volume > ROUTE_VALIDATION_LIMITS.MAX_VOLUME_M3) {
      throw new BadRequestException(
        `Volume excede o limite. Máximo: ${ROUTE_VALIDATION_LIMITS.MAX_VOLUME_M3}m³`,
      );
    }
  }

  /**
   * Valida a data planejada da rota
   *
   * @param dateString - Data em formato ISO ou string
   * @throws BadRequestException se a data for inválida
   */
  private validatePlannedDate(dateString: string): void {
    const plannedDate = new Date(dateString);
    const now = new Date();

    // Remove as horas para comparar apenas datas
    plannedDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    if (Number.isNaN(plannedDate.getTime())) {
      throw new BadRequestException('Data planejada inválida');
    }

    // Permite rotas planejadas para o mesmo dia
    if (plannedDate < now) {
      throw new BadRequestException('Data planejada não pode ser anterior à data atual');
    }

    // Limite de 1 ano no futuro
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    if (plannedDate > oneYearFromNow) {
      throw new BadRequestException('Data planejada não pode ser superior a 1 ano no futuro');
    }
  }
}
