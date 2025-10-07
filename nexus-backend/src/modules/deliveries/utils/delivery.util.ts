import type { Delivery } from '../entities/delivery.entity';
import { DeliveryStatus, DeliveryStatusTransitions } from '../enums/delivery-status.enum';
import { DeliveryPriority } from '../enums/delivery-priority.enum';

/**
 * Utilitários para gestão e operações com entregas
 *
 * Fornece métodos auxiliares para:
 * - Geração de códigos de rastreamento
 * - Cálculo de tempo estimado
 * - Validação de transições de status
 * - Verificação de possibilidade de cancelamento
 *
 * @class DeliveryUtils
 */
export class DeliveryUtils {
  /**
   * Prefixo padrão para códigos de rastreamento
   */
  private static readonly TRACKING_PREFIX = 'NXT';

  /**
   * Velocidade média de entrega em km/h
   */
  private static readonly AVERAGE_SPEED_KMH = 45;

  /**
   * Multiplicadores de tempo por prioridade
   */
  private static readonly PRIORITY_TIME_MULTIPLIERS: Record<DeliveryPriority, number> = {
    [DeliveryPriority.LOW]: 1.5,
    [DeliveryPriority.NORMAL]: 1.0,
    [DeliveryPriority.HIGH]: 0.7,
    [DeliveryPriority.CRITICAL]: 0.5,
  };

  /**
   * Gera um código de rastreamento único
   *
   * Formato: NXT-YYYYMMDD-XXXXX
   * - NXT: Prefixo da empresa
   * - YYYYMMDD: Data atual
   * - XXXXX: Número sequencial (5 dígitos)
   *
   * @param sequence - Número sequencial (1-99999)
   * @returns Código de rastreamento formatado
   *
   * @example
   * ```typescript
   * const code = DeliveryUtils.generateTrackingCode(1);
   * // Retorna: "NXT-20251005-00001"
   * ```
   */
  static generateTrackingCode(sequence: number): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const sequenceStr = String(sequence).padStart(5, '0');

    return `${this.TRACKING_PREFIX}-${year}${month}${day}-${sequenceStr}`;
  }

  /**
   * Calcula tempo estimado de entrega em minutos
   *
   * Considera:
   * - Distância em quilômetros
   * - Prioridade da entrega
   * - Velocidade média de 45 km/h
   *
   * @param distanceKm - Distância em quilômetros
   * @param priority - Prioridade da entrega
   * @returns Tempo estimado em minutos
   *
   * @example
   * ```typescript
   * const time = DeliveryUtils.calculateEstimatedTime(50, DeliveryPriority.HIGH);
   * // Retorna aproximadamente 47 minutos (50/45 * 60 * 0.7)
   * ```
   */
  static calculateEstimatedTime(
    distanceKm: number,
    priority: DeliveryPriority = DeliveryPriority.NORMAL,
  ): number {
    if (distanceKm <= 0) {
      return 0;
    }

    const baseTimeHours = distanceKm / this.AVERAGE_SPEED_KMH;
    const baseTimeMinutes = baseTimeHours * 60;
    const multiplier = this.PRIORITY_TIME_MULTIPLIERS[priority];

    return Math.round(baseTimeMinutes * multiplier);
  }

  /**
   * Valida se uma transição de status é permitida
   *
   * @param fromStatus - Status atual
   * @param toStatus - Status desejado
   * @returns true se a transição é válida
   *
   * @example
   * ```typescript
   * const valid = DeliveryUtils.validateStatusTransition(
   *   DeliveryStatus.PENDING,
   *   DeliveryStatus.ASSIGNED
   * );
   * // Retorna: true
   * ```
   */
  static validateStatusTransition(fromStatus: DeliveryStatus, toStatus: DeliveryStatus): boolean {
    const allowedTransitions = DeliveryStatusTransitions[fromStatus];
    return allowedTransitions.includes(toStatus);
  }

  /**
   * Verifica se uma entrega pode ser cancelada
   *
   * Critérios:
   * - Não pode estar em status final (DELIVERED)
   * - Pode ser cancelada em qualquer status antes de DELIVERED
   *
   * @param delivery - Entrega a ser verificada
   * @returns true se pode ser cancelada
   *
   * @example
   * ```typescript
   * const canCancel = DeliveryUtils.canCancelDelivery(delivery);
   * if (canCancel) {
   *   // Proceder com cancelamento
   * }
   * ```
   */
  static canCancelDelivery(delivery: Delivery): boolean {
    // Não pode cancelar se já foi entregue
    if (delivery.status === DeliveryStatus.DELIVERED) {
      return false;
    }

    // Não pode cancelar se já está cancelada
    if (delivery.status === DeliveryStatus.CANCELLED) {
      return false;
    }

    // Verifica se a transição para CANCELLED é permitida do status atual
    return this.validateStatusTransition(delivery.status, DeliveryStatus.CANCELLED);
  }

  /**
   * Verifica se uma entrega está em andamento
   *
   * @param delivery - Entrega a ser verificada
   * @returns true se está em andamento
   */
  static isDeliveryInProgress(delivery: Delivery): boolean {
    const inProgressStatuses: DeliveryStatus[] = [
      DeliveryStatus.ASSIGNED,
      DeliveryStatus.PICKED_UP,
      DeliveryStatus.IN_TRANSIT,
      DeliveryStatus.OUT_FOR_DELIVERY,
    ];

    return inProgressStatuses.includes(delivery.status);
  }

  /**
   * Verifica se uma entrega está finalizada
   *
   * @param delivery - Entrega a ser verificada
   * @returns true se está finalizada
   */
  static isDeliveryFinished(delivery: Delivery): boolean {
    return (
      delivery.status === DeliveryStatus.DELIVERED || delivery.status === DeliveryStatus.CANCELLED
    );
  }

  /**
   * Calcula o progresso percentual de uma entrega
   *
   * @param delivery - Entrega
   * @returns Progresso de 0 a 100
   */
  static calculateDeliveryProgress(delivery: Delivery): number {
    const statusProgress: Record<DeliveryStatus, number> = {
      [DeliveryStatus.PENDING]: 0,
      [DeliveryStatus.ASSIGNED]: 20,
      [DeliveryStatus.PICKED_UP]: 40,
      [DeliveryStatus.IN_TRANSIT]: 60,
      [DeliveryStatus.OUT_FOR_DELIVERY]: 80,
      [DeliveryStatus.DELIVERED]: 100,
      [DeliveryStatus.FAILED]: 0,
      [DeliveryStatus.CANCELLED]: 0,
    };

    return statusProgress[delivery.status] || 0;
  }

  /**
   * Extrai informações do código de rastreamento
   *
   * @param trackingCode - Código de rastreamento
   * @returns Objeto com informações extraídas
   */
  static parseTrackingCode(trackingCode: string): {
    prefix: string;
    date: Date | null;
    sequence: number;
    isValid: boolean;
  } {
    const regex = /^([A-Z]+)-(\d{8})-(\d{5})$/;
    const match = regex.exec(trackingCode);

    if (!match) {
      return {
        prefix: '',
        date: null,
        sequence: 0,
        isValid: false,
      };
    }

    const [, prefix = '', dateStr = '', sequenceStr = ''] = match;

    // Parse date YYYYMMDD
    const year = parseInt(dateStr.substring(0, 4), 10);
    const month = parseInt(dateStr.substring(4, 6), 10) - 1;
    const day = parseInt(dateStr.substring(6, 8), 10);
    const date = new Date(year, month, day);

    return {
      prefix,
      date,
      sequence: parseInt(sequenceStr, 10),
      isValid: true,
    };
  }
}
