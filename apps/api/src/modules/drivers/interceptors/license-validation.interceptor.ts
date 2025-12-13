import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverLicense } from '../entities/driver-license.entity';
import { CNH_EXPIRATION_WARNING_DAYS } from '../constants/driver.constants';

/**
 * Interceptor para validar CNH antes de operações críticas
 *
 * Funcionalidades:
 * - Verifica validade da CNH automaticamente
 * - Alerta sobre CNH próxima do vencimento
 * - Bloqueia ações se CNH vencida
 * - Valida categoria da CNH quando necessário
 *
 * @class LicenseValidationInterceptor
 */
@Injectable()
export class LicenseValidationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LicenseValidationInterceptor.name);

  constructor(
    @InjectRepository(DriverLicense)
    private readonly licenseRepository: Repository<DriverLicense>,
  ) {}

  /**
   * Rotas críticas que exigem CNH válida
   */
  private readonly CRITICAL_ROUTES = [
    '/drivers/:id/assign-delivery',
    '/drivers/:id/assign-route',
    '/drivers/:id/start-route',
    '/deliveries/:id/assign-driver',
  ];

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const url = request.url;

    // Verifica se é uma rota crítica
    const isCriticalRoute = this.isCriticalRoute(url);
    if (!isCriticalRoute) {
      return next.handle();
    }

    // Extrai o driverId da URL ou body
    const driverId = this.extractDriverId(request);
    if (!driverId) {
      this.logger.debug('DriverId não encontrado na requisição, pulando validação de CNH');
      return next.handle();
    }

    // Valida CNH antes de prosseguir
    return from(this.validateDriverLicense(driverId)).pipe(
      switchMap(() => {
        this.logger.debug(`CNH do motorista ${driverId} validada com sucesso`);
        return next.handle();
      }),
    );
  }

  /**
   * Valida a CNH do motorista
   *
   * @param driverId - ID do motorista
   * @throws BadRequestException se CNH inválida ou vencida
   * @throws NotFoundException se CNH não encontrada
   */
  private async validateDriverLicense(driverId: string): Promise<void> {
    const license = await this.licenseRepository.findOne({
      where: { driver: { id: driverId }, is_active: true },
      relations: ['driver'],
    });

    if (!license) {
      throw new NotFoundException(`CNH não encontrada para o motorista ${driverId}`);
    }

    const now = new Date();
    const expirationDate = new Date(license.expiration_date);

    // Verifica se está vencida
    if (expirationDate < now) {
      this.logger.error(`CNH do motorista ${driverId} está vencida`);
      throw new BadRequestException({
        message: 'CNH vencida. Não é possível realizar a operação.',
        driverId,
        expirationDate: license.expiration_date,
        licenseNumber: license.license_number,
      });
    }

    // Verifica se está próxima do vencimento
    const daysToExpiration = Math.floor(
      (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysToExpiration <= CNH_EXPIRATION_WARNING_DAYS) {
      this.logger.warn(
        `AVISO: CNH do motorista ${driverId} próxima do vencimento. ` +
          `Dias restantes: ${daysToExpiration}. ` +
          `Vencimento: ${license.expiration_date.toISOString()}`,
      );
    }

    // Verifica se a licença está ativa
    if (!license.is_active) {
      throw new BadRequestException({
        message: 'CNH inativa. Não é possível realizar a operação.',
        driverId,
        licenseNumber: license.license_number,
      });
    }
  }

  /**
   * Verifica se a rota é crítica e exige validação de CNH
   */
  private isCriticalRoute(url: string): boolean {
    return this.CRITICAL_ROUTES.some(route => {
      const pattern = route.replace(':id', '[^/]+');
      const regex = new RegExp(`^${pattern}(?:\\?.*)?$`);
      return regex.test(url);
    });
  }

  /**
   * Extrai o ID do motorista da requisição
   */
  private extractDriverId(request: Request): string | null {
    // Tenta extrair do parâmetro da URL
    if (request.params.id) {
      return request.params.id;
    }

    // Tenta extrair do body
    const body = request.body as { driver_id?: string; driverId?: string };
    if (body?.driver_id) {
      return body.driver_id;
    }
    if (body?.driverId) {
      return body.driverId;
    }

    return null;
  }
}
