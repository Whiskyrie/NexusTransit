import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  SoftRemoveEvent,
} from 'typeorm';
import { Logger } from '@nestjs/common';
import { Address } from '../entities';
import { AddressFormatterUtil } from '../utils';
import { normalizeBrazilianState } from '../enums';

/**
 * Subscriber para eventos de lifecycle da entidade Address
 *
 * Responsável por:
 * - Normalizar dados antes de inserir/atualizar
 * - Validar dados antes de persistir
 * - Logar operações importantes
 * - Disparar eventos assíncronos (ex: geocoding)
 */
@EventSubscriber()
export class AddressSubscriber implements EntitySubscriberInterface<Address> {
  private readonly logger = new Logger(AddressSubscriber.name);

  /**
   * Define qual entidade este subscriber monitora
   */
  listenTo(): typeof Address {
    return Address;
  }

  /**
   * Antes de inserir um novo endereço
   */
  beforeInsert(event: InsertEvent<Address>): void {
    const entity = event.entity;

    this.logger.debug(
      `Before insert address: ${JSON.stringify({
        city: entity.city,
        state: entity.state,
      })}`,
    );

    // Normalizar dados
    this.normalizeAddressData(entity);

    // Validar dados críticos
    this.validateCriticalFields(entity);
  }

  /**
   * Após inserir um novo endereço
   */
  afterInsert(event: InsertEvent<Address>): void {
    const entity = event.entity;

    this.logger.log(`Address created: ${entity.id} - ${entity.city}/${entity.state}`);

    // Log adicional se possui coordenadas
    if (entity.latitude && entity.longitude) {
      this.logger.debug(
        `Address ${entity.id} criado com coordenadas: ${entity.latitude}, ${entity.longitude}`,
      );
    } else {
      this.logger.debug(
        `Address ${entity.id} criado sem coordenadas - geocoding pode ser necessário`,
      );
    }
  }

  /**
   * Antes de atualizar um endereço
   */
  beforeUpdate(event: UpdateEvent<Address>): void {
    const entity = event.entity as Address;
    const databaseEntity = event.databaseEntity;

    if (!entity || !databaseEntity) {
      return;
    }

    this.logger.debug(`Before update address: ${entity.id} - ${entity.city}/${entity.state}`);

    // Normalizar dados
    this.normalizeAddressData(entity);

    // Verificar se endereço mudou (pode precisar novo geocoding)
    const addressChanged = this.hasAddressChanged(entity, databaseEntity);

    if (addressChanged) {
      this.logger.debug(
        `Address ${entity.id} teve alteração nos dados - geocoding pode ser necessário`,
      );

      // Resetar coordenadas se endereço mudou significativamente
      // (elas serão recalculadas por geocoding)
      // Comentado para não forçar reset automático
      // entity.latitude = null;
      // entity.longitude = null;
    }
  }

  /**
   * Após atualizar um endereço
   */
  afterUpdate(event: UpdateEvent<Address>): void {
    const entity = event.entity as Address;

    if (!entity) {
      return;
    }

    this.logger.log(`Address updated: ${entity.id} - ${entity.city}/${entity.state}`);
  }

  /**
   * Antes de soft delete
   */
  beforeSoftRemove(event: SoftRemoveEvent<Address>): void {
    const entity = event.entity;

    if (!entity) {
      return;
    }

    this.logger.debug(`Before soft remove address: ${entity.id}`);
  }

  /**
   * Após soft delete
   */
  afterSoftRemove(event: SoftRemoveEvent<Address>): void {
    const entity = event.entity;

    if (!entity) {
      return;
    }

    this.logger.log(`Address soft removed: ${entity.id} - ${entity.city}/${entity.state}`);
  }

  /**
   * Normaliza dados do endereço
   */
  private normalizeAddressData(entity: Address): void {
    // Normalizar CEP
    if (entity.cep) {
      entity.cep = AddressFormatterUtil.normalizeCep(entity.cep);
      entity.cep = AddressFormatterUtil.formatCep(entity.cep);
    }

    // Normalizar estado (converter para maiúsculas)
    if (entity.state) {
      const normalized = normalizeBrazilianState(entity.state);
      if (normalized) {
        entity.state = normalized;
      }
    }

    // Capitalizar nomes
    if (entity.street) {
      entity.street = AddressFormatterUtil.capitalizeWords(entity.street.trim());
    }

    if (entity.neighborhood) {
      entity.neighborhood = AddressFormatterUtil.capitalizeWords(entity.neighborhood.trim());
    }

    if (entity.city) {
      entity.city = AddressFormatterUtil.normalizeCityName(entity.city.trim());
    }

    // Sanitizar campos opcionais
    if (entity.complement) {
      entity.complement = AddressFormatterUtil.sanitizeAddressField(entity.complement);
    }

    if (entity.number) {
      entity.number = entity.number.trim();
    }

    // Gerar endereço formatado se não existir
    entity.formatted_address ??= this.generateFormattedAddress(entity);
  }

  /**
   * Valida campos críticos
   */
  private validateCriticalFields(entity: Address): void {
    if (!entity.street) {
      this.logger.warn(`Address sem logradouro - validação pode falhar`);
    }

    if (!entity.city) {
      this.logger.warn(`Address sem cidade - validação pode falhar`);
    }

    if (!entity.state) {
      this.logger.warn(`Address sem estado - validação pode falhar`);
    }

    if (!entity.neighborhood) {
      this.logger.warn(`Address sem bairro - validação pode falhar`);
    }
  }

  /**
   * Verifica se dados do endereço mudaram
   */
  private hasAddressChanged(newEntity: Address, oldEntity: Address): boolean {
    return (
      newEntity.street !== oldEntity.street ||
      newEntity.number !== oldEntity.number ||
      newEntity.neighborhood !== oldEntity.neighborhood ||
      newEntity.city !== oldEntity.city ||
      newEntity.state !== oldEntity.state ||
      newEntity.cep !== oldEntity.cep
    );
  }

  /**
   * Gera endereço formatado
   */
  private generateFormattedAddress(entity: Address): string {
    return AddressFormatterUtil.formatAddress({
      street: entity.street,
      number: entity.number,
      complement: entity.complement,
      neighborhood: entity.neighborhood,
      city: entity.city,
      state: entity.state,
      country: entity.country,
    });
  }
}
