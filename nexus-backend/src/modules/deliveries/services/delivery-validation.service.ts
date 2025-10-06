import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery } from '../entities/delivery.entity';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import type { TimeWindow } from '../interfaces/time-window.interface';
import { TimeWindowUtils } from '../utils/time-window.util';
import { AddressUtils } from '../utils/address.util';
import type { BrazilianAddress, Coordinates } from '../interfaces/address.interface';

/**
 * Interface para resultado de validação
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Serviço de validação de entregas
 *
 * Responsabilidades:
 * - Validar janelas de tempo
 * - Verificar possibilidade de atribuir motorista
 * - Validar endereços
 * - Verificar restrições de entrega
 *
 * @class DeliveryValidationService
 */
@Injectable()
export class DeliveryValidationService {
  constructor(
    @InjectRepository(Delivery)
    private readonly deliveryRepository: Repository<Delivery>,
  ) {}

  /**
   * Valida uma janela de tempo de entrega
   */
  validateTimeWindow(timeWindow: TimeWindow): ValidationResult {
    const errors: string[] = [];

    if (!TimeWindowUtils.validateTimeWindow(timeWindow.start, timeWindow.end)) {
      errors.push('Janela de tempo inválida: data de início deve ser anterior à data de fim');
    }

    const now = new Date();
    if (timeWindow.end < now) {
      errors.push('Janela de tempo já passou');
    }

    const duration = Math.floor(
      (timeWindow.end.getTime() - timeWindow.start.getTime()) / (1000 * 60),
    );
    if (duration < 30) {
      errors.push('Janela de tempo muito curta (mínimo 30 minutos)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Verifica se um motorista pode ser atribuído a uma entrega
   */
  async canAssignDriver(deliveryId: string, driverId: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const delivery = await this.deliveryRepository.findOne({
      where: { id: deliveryId },
    });

    if (!delivery) {
      errors.push('Entrega não encontrada');
      return { valid: false, errors };
    }

    if (delivery.status !== DeliveryStatus.PENDING && delivery.status !== DeliveryStatus.ASSIGNED) {
      errors.push(`Não é possível atribuir motorista: entrega está com status ${delivery.status}`);
    }

    if (delivery.driver_id && delivery.driver_id !== driverId) {
      warnings.push(`Entrega já possui motorista atribuído (${delivery.driver_id})`);
    }

    // Verificar se motorista já tem entregas conflitantes no mesmo horário
    const timeWindows = delivery.settings?.time_windows?.[0];
    if (timeWindows) {
      const conflicting = await this.deliveryRepository
        .createQueryBuilder('delivery')
        .where('delivery.driver_id = :driverId', { driverId })
        .andWhere('delivery.status IN (:...statuses)', {
          statuses: [
            DeliveryStatus.ASSIGNED,
            DeliveryStatus.PICKED_UP,
            DeliveryStatus.IN_TRANSIT,
            DeliveryStatus.OUT_FOR_DELIVERY,
          ],
        })
        .andWhere("delivery.settings->>'time_windows' IS NOT NULL")
        .getMany();

      for (const existing of conflicting) {
        const existingWindow = existing.settings?.time_windows?.[0];
        if (existingWindow) {
          const window1: TimeWindow = {
            start: new Date(timeWindows.start),
            end: new Date(timeWindows.end),
          };
          const window2: TimeWindow = {
            start: new Date(existingWindow.start),
            end: new Date(existingWindow.end),
          };

          if (TimeWindowUtils.doWindowsOverlap(window1, window2)) {
            warnings.push(`Motorista possui entrega conflitante (${existing.tracking_code})`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Valida um endereço de entrega
   */
  validateAddress(address: BrazilianAddress): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!address.city || address.city.trim().length === 0) {
      errors.push('Cidade é obrigatória');
    }

    if (!address.state || address.state.trim().length !== 2) {
      errors.push('Estado deve ter 2 caracteres (UF)');
    }

    if (!address.postal_code) {
      errors.push('CEP é obrigatório');
    } else {
      const normalizedCep = AddressUtils.normalizeAddress({
        ...address,
        postal_code: address.postal_code,
      }).postal_code;
      if (!/^\d{5}-\d{3}$/.test(normalizedCep)) {
        errors.push('CEP inválido (formato esperado: 12345-678)');
      }
    }

    if (!address.street || address.street.trim().length === 0) {
      errors.push('Rua é obrigatória');
    }

    if (!address.number || address.number.trim().length === 0) {
      warnings.push('Número não informado');
    }

    if (address.latitude !== undefined && address.longitude !== undefined) {
      const coords: Coordinates = {
        latitude: address.latitude,
        longitude: address.longitude,
      };

      const brazilBounds = {
        minLat: -33.75,
        maxLat: 5.27,
        minLon: -73.99,
        maxLon: -28.84,
      };

      if (
        coords.latitude < brazilBounds.minLat ||
        coords.latitude > brazilBounds.maxLat ||
        coords.longitude < brazilBounds.minLon ||
        coords.longitude > brazilBounds.maxLon
      ) {
        warnings.push('Coordenadas fora do Brasil');
      }
    } else {
      warnings.push('Coordenadas não informadas');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Verifica restrições de uma entrega
   */
  async checkDeliveryConstraints(deliveryId: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const delivery = await this.deliveryRepository.findOne({
      where: { id: deliveryId },
    });

    if (!delivery) {
      errors.push('Entrega não encontrada');
      return { valid: false, errors };
    }

    // Verificar janela de tempo
    const timeWindows = delivery.settings?.time_windows?.[0];
    if (timeWindows) {
      const window: TimeWindow = {
        start: new Date(timeWindows.start),
        end: new Date(timeWindows.end),
      };

      if (TimeWindowUtils.hasWindowPassed(window)) {
        errors.push('Janela de entrega já passou');
      }

      const now = new Date();
      const minutesUntilWindow = Math.floor((window.start.getTime() - now.getTime()) / (1000 * 60));

      if (minutesUntilWindow < 60 && minutesUntilWindow > 0) {
        warnings.push(`Janela de entrega começa em ${minutesUntilWindow} minutos`);
      }
    }

    // Verificar distância estimada
    if (delivery.estimated_distance && delivery.estimated_distance > 100) {
      warnings.push(`Distância estimada muito longa: ${delivery.estimated_distance}km`);
    }

    // Verificar tentativas de entrega
    const attemptCount = delivery.settings?.allowed_attempt_count ?? 3;
    const deliveryAttempts = delivery.metadata?.delivery_attempts ?? 0;

    if (deliveryAttempts >= attemptCount) {
      errors.push(`Número máximo de tentativas atingido (${attemptCount})`);
    }

    // Verificar peso (se aplicável)
    const weight = delivery.item_details?.weight_kg;
    if (weight && weight > 30) {
      warnings.push(`Peso da carga é elevado: ${weight}kg`);
    }

    // Verificar se motorista está atribuído para entregas que precisam
    if (
      delivery.status === DeliveryStatus.PICKED_UP ||
      delivery.status === DeliveryStatus.IN_TRANSIT ||
      delivery.status === DeliveryStatus.OUT_FOR_DELIVERY
    ) {
      if (!delivery.driver_id) {
        errors.push('Entrega em trânsito sem motorista atribuído');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Valida múltiplas entregas de uma só vez
   */
  async validateMultiple(deliveryIds: string[]): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>();

    for (const id of deliveryIds) {
      const result = await this.checkDeliveryConstraints(id);
      results.set(id, result);
    }

    return results;
  }

  /**
   * Verifica se uma entrega pode ser cancelada
   */
  async canCancelDelivery(deliveryId: string): Promise<ValidationResult> {
    const errors: string[] = [];

    const delivery = await this.deliveryRepository.findOne({
      where: { id: deliveryId },
    });

    if (!delivery) {
      errors.push('Entrega não encontrada');
      return { valid: false, errors };
    }

    const nonCancellableStatuses = [DeliveryStatus.DELIVERED, DeliveryStatus.CANCELLED];

    if (nonCancellableStatuses.includes(delivery.status)) {
      errors.push(`Não é possível cancelar entrega com status ${delivery.status}`);
    }

    if (delivery.status === DeliveryStatus.OUT_FOR_DELIVERY) {
      errors.push('Entrega já está saindo para entrega, cancele diretamente com o motorista');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
