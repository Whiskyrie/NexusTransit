import type { Vehicle } from '../entities/vehicle.entity';
import { VehicleStatus } from '../enums/vehicle-status.enum';
import type { Delivery } from '../../deliveries/entities/delivery.entity';
import { DeliveryStatus } from '../../deliveries/enums/delivery-status.enum';
import { DocumentType } from '../dto/document.dto';
import type { VehicleDocumentValidationResult } from '../interfaces/vehicle-utilization.interface';

// Type alias para manter compatibilidade com código existente
export type ValidationResult = VehicleDocumentValidationResult;

/**
 * Utilitários para gestão e validação de veículos
 *
 * Fornece métodos auxiliares para:
 * - Verificar disponibilidade de veículos
 * - Validar atribuição a entregas
 * - Calcular datas de manutenção
 * - Validar documentação obrigatória
 *
 * @class VehicleUtils
 */
export class VehicleUtils {
  /**
   * Prazo em dias para considerar documento como "vencendo em breve"
   */
  private static readonly DOCUMENT_EXPIRING_THRESHOLD_DAYS = 30;

  /**
   * Intervalo padrão de manutenção em quilômetros
   */
  private static readonly DEFAULT_MAINTENANCE_INTERVAL_KM = 10000;

  /**
   * Intervalo padrão de manutenção em meses
   */
  private static readonly DEFAULT_MAINTENANCE_INTERVAL_MONTHS = 6;

  /**
   * Verifica se um veículo pode ser atribuído a uma entrega
   *
   * Considera:
   * - Status do veículo (deve estar ACTIVE)
   * - Capacidade de carga
   * - Disponibilidade (não estar em outra entrega ativa)
   * - Documentação válida
   *
   * @param vehicle - Veículo a ser verificado
   * @param delivery - Entrega para atribuição
   * @returns true se o veículo pode ser atribuído, false caso contrário
   *
   * @example
   * ```typescript
   * const canAssign = VehicleUtils.canAssignToDelivery(vehicle, delivery);
   * if (canAssign) {
   *   // Atribuir veículo à entrega
   * }
   * ```
   */
  static canAssignToDelivery(vehicle: Vehicle, delivery: Delivery): boolean {
    // Verifica status do veículo
    if (vehicle.status !== VehicleStatus.ACTIVE) {
      return false;
    }

    // Verifica se há capacidade de carga suficiente (se informada)
    if (delivery.weight && vehicle.load_capacity) {
      if (delivery.weight > Number(vehicle.load_capacity)) {
        return false;
      }
    }

    // Verifica se o veículo já está em uma entrega ativa
    if (vehicle.deliveries && vehicle.deliveries.length > 0) {
      const hasActiveDelivery = vehicle.deliveries.some(
        d => d.status === DeliveryStatus.IN_TRANSIT || d.status === DeliveryStatus.PICKED_UP,
      );

      if (hasActiveDelivery) {
        return false;
      }
    }

    // Verifica se precisa de manutenção urgente
    if (vehicle.needs_maintenance) {
      return false;
    }

    // Verifica documentação básica
    const validation = this.validateVehicleDocuments(vehicle);
    if (!validation.isValid) {
      return false;
    }

    return true;
  }

  /**
   * Verifica se um veículo está disponível em uma data específica
   *
   * Considera:
   * - Status do veículo
   * - Manutenções programadas
   * - Entregas já agendadas para a data
   *
   * @param vehicle - Veículo a ser verificado
   * @param date - Data para verificar disponibilidade
   * @returns true se o veículo está disponível, false caso contrário
   *
   * @example
   * ```typescript
   * const isAvailable = VehicleUtils.isVehicleAvailable(vehicle, new Date('2025-10-10'));
   * ```
   */
  static isVehicleAvailable(vehicle: Vehicle, date: Date): boolean {
    // Verifica status do veículo
    if (vehicle.status !== VehicleStatus.ACTIVE) {
      return false;
    }

    // Verifica se há manutenção programada para a data
    if (vehicle.next_maintenance_at) {
      const maintenanceDate = new Date(vehicle.next_maintenance_at);
      const checkDate = new Date(date);

      // Considera indisponível no dia da manutenção
      if (
        maintenanceDate.getDate() === checkDate.getDate() &&
        maintenanceDate.getMonth() === checkDate.getMonth() &&
        maintenanceDate.getFullYear() === checkDate.getFullYear()
      ) {
        return false;
      }
    }

    // Verifica se há entregas agendadas para a data
    if (vehicle.deliveries && vehicle.deliveries.length > 0) {
      const hasScheduledDelivery = vehicle.deliveries.some(delivery => {
        if (!delivery.scheduled_delivery_at) {
          return false;
        }

        const deliveryDate = new Date(delivery.scheduled_delivery_at);
        const checkDate = new Date(date);

        return (
          deliveryDate.getDate() === checkDate.getDate() &&
          deliveryDate.getMonth() === checkDate.getMonth() &&
          deliveryDate.getFullYear() === checkDate.getFullYear() &&
          (delivery.status === DeliveryStatus.ASSIGNED ||
            delivery.status === DeliveryStatus.PICKED_UP ||
            delivery.status === DeliveryStatus.IN_TRANSIT)
        );
      });

      if (hasScheduledDelivery) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calcula a data da próxima manutenção devida
   *
   * Considera:
   * - Quilometragem atual vs. intervalo de manutenção
   * - Última manutenção realizada
   * - Intervalo de tempo desde a última manutenção
   *
   * @param vehicle - Veículo para calcular manutenção
   * @returns Data estimada da próxima manutenção
   *
   * @example
   * ```typescript
   * const nextMaintenance = VehicleUtils.calculateMaintenanceDue(vehicle);
   * console.log(`Próxima manutenção: ${nextMaintenance.toLocaleDateString()}`);
   * ```
   */
  static calculateMaintenanceDue(vehicle: Vehicle): Date {
    const now = new Date();

    // Se já tem uma data programada, retorna ela
    if (vehicle.next_maintenance_at) {
      return new Date(vehicle.next_maintenance_at);
    }

    // Se nunca teve manutenção, calcula baseado no intervalo padrão
    if (!vehicle.last_maintenance_at) {
      const dueDate = new Date(now);
      dueDate.setMonth(dueDate.getMonth() + this.DEFAULT_MAINTENANCE_INTERVAL_MONTHS);
      return dueDate;
    }

    // Calcula baseado na última manutenção
    const lastMaintenance = new Date(vehicle.last_maintenance_at);
    const monthsSinceLastMaintenance = this.getMonthsDifference(lastMaintenance, now);

    // Se já passou do intervalo, a manutenção já está vencida
    if (monthsSinceLastMaintenance >= this.DEFAULT_MAINTENANCE_INTERVAL_MONTHS) {
      return now;
    }

    // Calcula a próxima data baseada no intervalo
    const nextMaintenanceDate = new Date(lastMaintenance);
    nextMaintenanceDate.setMonth(
      nextMaintenanceDate.getMonth() + this.DEFAULT_MAINTENANCE_INTERVAL_MONTHS,
    );

    // Também considera a quilometragem
    if (vehicle.mileage) {
      const kmSinceLastMaintenance = vehicle.mileage % this.DEFAULT_MAINTENANCE_INTERVAL_KM;
      const kmUntilMaintenance = this.DEFAULT_MAINTENANCE_INTERVAL_KM - kmSinceLastMaintenance;

      // Se estiver próximo do limite de km, considera isso também
      if (kmUntilMaintenance < 1000) {
        // Antecipa em 1 mês se estiver perto do limite de km
        nextMaintenanceDate.setMonth(nextMaintenanceDate.getMonth() - 1);
      }
    }

    return nextMaintenanceDate;
  }

  /**
   * Valida todos os documentos obrigatórios do veículo
   *
   * Verifica:
   * - Documentos expirados
   * - Documentos vencendo em breve (próximos 30 dias)
   * - Documentos obrigatórios ausentes
   *
   * @param vehicle - Veículo para validar documentos
   * @returns Resultado da validação com erros, avisos e documentos problemáticos
   *
   * @example
   * ```typescript
   * const validation = VehicleUtils.validateVehicleDocuments(vehicle);
   * if (!validation.isValid) {
   *   console.error('Erros:', validation.errors);
   *   console.warn('Avisos:', validation.warnings);
   * }
   * ```
   */
  static validateVehicleDocuments(vehicle: Vehicle): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      expiringSoon: [],
      expired: [],
    };

    if (!vehicle.documents || vehicle.documents.length === 0) {
      result.isValid = false;
      result.errors.push('Veículo não possui documentos cadastrados');
      return result;
    }

    const now = new Date();
    const thresholdDate = new Date(now);
    thresholdDate.setDate(thresholdDate.getDate() + this.DOCUMENT_EXPIRING_THRESHOLD_DAYS);

    // Tipos de documentos obrigatórios
    const requiredDocTypes: DocumentType[] = [
      DocumentType.CRLV,
      DocumentType.INSURANCE,
      DocumentType.INSPECTION,
    ];

    // Verifica cada documento
    for (const doc of vehicle.documents) {
      if (doc.expiry_date) {
        const expirationDate = new Date(doc.expiry_date);

        // Documento expirado
        if (expirationDate < now) {
          result.isValid = false;
          result.expired.push(doc);
          result.errors.push(
            `Documento ${doc.document_type} expirado em ${expirationDate.toLocaleDateString()}`,
          );
        }
        // Documento vencendo em breve
        else if (expirationDate <= thresholdDate) {
          result.expiringSoon.push(doc);
          result.warnings.push(
            `Documento ${doc.document_type} vence em ${expirationDate.toLocaleDateString()}`,
          );
        }
      }
    }

    // Verifica documentos obrigatórios
    const existingDocTypes = vehicle.documents.map(d => d.document_type);
    for (const requiredType of requiredDocTypes) {
      if (!existingDocTypes.includes(requiredType)) {
        result.isValid = false;
        result.errors.push(`Documento obrigatório ${requiredType.toUpperCase()} não encontrado`);
      }
    }

    return result;
  }

  /**
   * Calcula a diferença em meses entre duas datas
   *
   * @param startDate - Data inicial
   * @param endDate - Data final
   * @returns Número de meses de diferença
   * @private
   */
  private static getMonthsDifference(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const yearsDiff = end.getFullYear() - start.getFullYear();
    const monthsDiff = end.getMonth() - start.getMonth();

    return yearsDiff * 12 + monthsDiff;
  }
}
