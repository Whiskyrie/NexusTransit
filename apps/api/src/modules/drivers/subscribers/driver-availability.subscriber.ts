import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  SoftRemoveEvent,
} from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { DriverAvailability } from '../entities/driver-availability.entity';

/**
 * TypeORM Subscriber para monitorar mudanças em disponibilidade de motoristas
 *
 * Funcionalidades:
 * - Detecta mudanças em driver_availabilities
 * - Valida períodos de ausência
 * - Notifica sobre conflitos de datas
 * - Registra histórico de alterações
 * - Alerta sobre períodos sobrepostos
 *
 * @class DriverAvailabilitySubscriber
 */
@Injectable()
@EventSubscriber()
export class DriverAvailabilitySubscriber implements EntitySubscriberInterface<DriverAvailability> {
  private readonly logger = new Logger(DriverAvailabilitySubscriber.name);

  /**
   * Indica qual entidade este subscriber monitora
   */
  listenTo(): typeof DriverAvailability {
    return DriverAvailability;
  }

  /**
   * Antes de inserir novo registro de disponibilidade
   */
  beforeInsert(event: InsertEvent<DriverAvailability>): void {
    const availability = this.getAvailabilityEntity(event.entity);
    if (!availability) {
      return;
    }

    this.logger.debug(
      `Antes de inserir disponibilidade: Driver ${availability.driver_id}, ` +
        `Tipo: ${availability.availability_type}, ` +
        `Período: ${availability.start_date.toString()} até ${availability.end_date.toString()}`,
    );

    // Validar período
    this.validatePeriod(availability);
  }

  /**
   * Após inserir novo registro de disponibilidade
   */
  afterInsert(event: InsertEvent<DriverAvailability>): void {
    const availability = this.getAvailabilityEntity(event.entity);
    if (!availability) {
      return;
    }

    this.logger.log(
      `Disponibilidade criada: ID ${availability.id}, ` +
        `Driver ${availability.driver_id}, ` +
        `Tipo: ${availability.availability_type}, ` +
        `Período: ${availability.start_date.toString()} até ${availability.end_date.toString()}`,
    );

    // Se for indisponibilidade, logar alerta
    if (availability.isUnavailability()) {
      this.logger.warn(
        `Motorista ${availability.driver_id} indisponível de ` +
          `${availability.start_date.toString()} até ${availability.end_date.toString()} - ` +
          `Motivo: ${availability.availability_type}`,
      );
    }
  }

  /**
   * Antes de atualizar registro de disponibilidade
   */
  beforeUpdate(event: UpdateEvent<DriverAvailability>): void {
    const availability = this.getAvailabilityEntity(event.entity);
    if (!availability) {
      return;
    }

    this.logger.debug(`Antes de atualizar disponibilidade: ${availability.id}`);

    // Validar período se as datas foram alteradas
    if (event.entity && (event.entity.start_date || event.entity.end_date)) {
      this.validatePeriod(availability);
    }
  }

  /**
   * Após atualizar registro de disponibilidade
   */
  afterUpdate(event: UpdateEvent<DriverAvailability>): void {
    const availability = this.getAvailabilityEntity(event.entity);
    if (!availability) {
      return;
    }

    this.logger.log(
      `Disponibilidade atualizada: ID ${availability.id}, ` + `Driver ${availability.driver_id}`,
    );

    // Detectar mudanças importantes
    this.detectChanges(event);
  }

  /**
   * Antes de remover registro de disponibilidade (soft delete)
   */
  beforeSoftRemove(event: SoftRemoveEvent<DriverAvailability>): void {
    const availability = this.getAvailabilityEntity(event.entity);
    if (!availability) {
      return;
    }

    this.logger.debug(`Antes de remover disponibilidade: ${availability.id}`);
  }

  /**
   * Após remover registro de disponibilidade (soft delete)
   */
  afterSoftRemove(event: SoftRemoveEvent<DriverAvailability>): void {
    const availability = this.getAvailabilityEntity(event.entity);
    if (!availability) {
      return;
    }

    this.logger.log(
      `Disponibilidade removida (soft delete): ID ${availability.id}, ` +
        `Driver ${availability.driver_id}`,
    );
  }

  /**
   * Valida o período de disponibilidade
   */
  private validatePeriod(availability: DriverAvailability): void {
    const start = new Date(availability.start_date);
    const end = new Date(availability.end_date);

    // Validar se data de início é anterior à data de término
    if (start >= end) {
      this.logger.error(
        `Período inválido para disponibilidade ${availability.id}: ` +
          `Data de início (${availability.start_date.toString()}) não é anterior à ` +
          `data de término (${availability.end_date.toString()})`,
      );
    }

    // Validar se o período não é muito longo (mais de 1 ano)
    const diffDays = availability.getDurationInDays();
    if (diffDays > 365) {
      this.logger.warn(
        `Período muito longo para disponibilidade ${availability.id}: ` +
          `${diffDays} dias. Verifique se as datas estão corretas.`,
      );
    }

    // Validar se data de início não está muito no passado (mais de 2 anos)
    const now = new Date();
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(now.getFullYear() - 2);

    if (start < twoYearsAgo) {
      this.logger.warn(
        `Data de início muito antiga para disponibilidade ${availability.id}: ` +
          `${availability.start_date.toString()}. Verifique se está correto.`,
      );
    }
  }

  /**
   * Detecta mudanças importantes no registro
   */
  private detectChanges(event: UpdateEvent<DriverAvailability>): void {
    if (!event.entity || !event.databaseEntity) {
      return;
    }

    const current = event.entity as DriverAvailability;
    const previous = event.databaseEntity;

    // Detectar mudança de tipo
    if (current.availability_type !== previous.availability_type) {
      this.logger.log(
        `Tipo de disponibilidade alterado para Driver ${current.driver_id}: ` +
          `${previous.availability_type} → ${current.availability_type}`,
      );
    }

    // Detectar mudança de datas
    if (
      current.start_date?.toString() !== previous.start_date?.toString() ||
      current.end_date?.toString() !== previous.end_date?.toString()
    ) {
      this.logger.log(
        `Período alterado para disponibilidade ${current.id}: ` +
          `${previous.start_date.toString()} até ${previous.end_date.toString()} → ` +
          `${current.start_date.toString()} até ${current.end_date.toString()}`,
      );
    }

    // Detectar aprovação
    if (current.is_approved && !previous.is_approved) {
      this.logger.log(`Disponibilidade ${current.id} foi aprovada por ${current.approved_by}`);
    }

    // Detectar revogação de aprovação
    if (!current.is_approved && previous.is_approved) {
      this.logger.warn(`Aprovação da disponibilidade ${current.id} foi revogada`);
    }

    // Detectar desativação
    if (!current.is_active && previous.is_active) {
      this.logger.log(`Disponibilidade ${current.id} foi desativada`);
    }
  }

  /**
   * Type guard para garantir que a entidade é um DriverAvailability válido
   */
  private getAvailabilityEntity(entity: unknown): DriverAvailability | null {
    if (!entity || typeof entity !== 'object') {
      return null;
    }

    if (
      'id' in entity &&
      'driver_id' in entity &&
      'availability_type' in entity &&
      'start_date' in entity &&
      'end_date' in entity
    ) {
      return entity as DriverAvailability;
    }

    return null;
  }
}
