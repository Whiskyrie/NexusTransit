import { EntitySubscriberInterface, EventSubscriber, UpdateEvent, InsertEvent } from 'typeorm';
import { Logger, Injectable } from '@nestjs/common';
import { DriverLicense } from '../entities/driver-license.entity';
import { CNH_EXPIRATION_WARNING_DAYS } from '../constants/driver.constants';

/**
 * TypeORM Subscriber para monitorar mudanças em CNH de motoristas
 *
 * Funcionalidades:
 * - Detecta mudanças em driver_licenses
 * - Valida renovações de CNH
 * - Notifica sobre vencimentos próximos
 * - Registra histórico de alterações
 *
 * @class DriverLicenseSubscriber
 */
@Injectable()
@EventSubscriber()
export class DriverLicenseSubscriber implements EntitySubscriberInterface<DriverLicense> {
  private readonly logger = new Logger(DriverLicenseSubscriber.name);

  /**
   * Indica qual entidade este subscriber monitora
   */
  listenTo(): typeof DriverLicense {
    return DriverLicense;
  }

  /**
   * Chamado após inserir uma nova CNH
   */
  afterInsert(event: InsertEvent<DriverLicense>): void {
    const entity = this.getDriverLicenseEntity(event.entity);

    if (!entity) {
      return;
    }

    this.logger.log(
      `Nova CNH cadastrada: ${entity.license_number} - Categoria: ${entity.category}`,
    );

    // Verifica se já está próxima do vencimento
    this.checkExpiration(entity);
  }

  /**
   * Chamado após atualizar uma CNH
   */
  afterUpdate(event: UpdateEvent<DriverLicense>): void {
    const entity = this.getDriverLicenseEntity(event.entity);
    const databaseEntity = this.getDriverLicenseEntity(event.databaseEntity);

    if (!entity || !databaseEntity) {
      return;
    }

    // Detecta renovação de CNH
    if (this.isRenewal(entity, databaseEntity)) {
      this.logger.log(
        `CNH renovada: ${entity.license_number} - Nova validade: ${entity.expiration_date.toISOString()}`,
      );
    }

    // Detecta mudança de categoria
    if (entity.category !== databaseEntity.category) {
      this.logger.log(
        `Categoria da CNH alterada: ${databaseEntity.category} -> ${entity.category}`,
      );
    }

    // Detecta mudança de status ativo/inativo
    if (entity.is_active !== databaseEntity.is_active) {
      const status = entity.is_active ? 'ativada' : 'desativada';
      this.logger.warn(`CNH ${entity.license_number} foi ${status}`);
    }

    // Verifica vencimento
    this.checkExpiration(entity);
  }

  /**
   * Verifica se é uma renovação de CNH
   */
  private isRenewal(newEntity: DriverLicense, oldEntity: DriverLicense): boolean {
    const newExpiration = new Date(newEntity.expiration_date);
    const oldExpiration = new Date(oldEntity.expiration_date);

    // Considera renovação se a data de validade foi estendida
    return newExpiration > oldExpiration;
  }

  /**
   * Verifica se a CNH está próxima do vencimento
   */
  private checkExpiration(entity: DriverLicense): void {
    const now = new Date();
    const expirationDate = new Date(entity.expiration_date);

    // Verifica se já está vencida
    if (expirationDate < now) {
      this.logger.error(
        `ALERTA: CNH ${entity.license_number} está VENCIDA desde ${expirationDate.toISOString()}`,
      );
      return;
    }

    // Calcula dias restantes
    const daysToExpiration = Math.floor(
      (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysToExpiration <= CNH_EXPIRATION_WARNING_DAYS) {
      this.logger.warn(
        `AVISO: CNH ${entity.license_number} próxima do vencimento. ` +
          `Dias restantes: ${daysToExpiration} - ` +
          `Vencimento: ${expirationDate.toISOString()}`,
      );

      // TODO: Implementar notificação para o motorista e administradores
      // this.notificationService.notifyCNHExpiration(entity);
    }
  }

  /**
   * Type guard para garantir que a entidade é um DriverLicense válido
   */
  private getDriverLicenseEntity(entity: unknown): DriverLicense | null {
    if (!entity || typeof entity !== 'object') {
      return null;
    }

    if (
      'id' in entity &&
      'license_number' in entity &&
      'category' in entity &&
      'expiration_date' in entity
    ) {
      return entity as DriverLicense;
    }

    return null;
  }
}
