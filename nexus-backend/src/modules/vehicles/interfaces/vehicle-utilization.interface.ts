import type { VehicleDocument } from '../entities/vehicle-document.entity';

/**
 * Interface para resultado da validação de documentos do veículo
 *
 * Contém informações sobre documentos válidos, expirados e em alerta
 */
export interface VehicleDocumentValidationResult {
  /**
   * Indica se a validação foi bem-sucedida
   */
  isValid: boolean;

  /**
   * Lista de erros encontrados (documentos ausentes ou expirados)
   */
  errors: string[];

  /**
   * Lista de avisos (documentos vencendo em breve)
   */
  warnings: string[];

  /**
   * Documentos que estão vencendo em breve
   */
  expiringSoon: VehicleDocument[];

  /**
   * Documentos que já expiraram
   */
  expired: VehicleDocument[];
}

/**
 * Interface para verificação de disponibilidade de veículo
 */
export interface VehicleAvailabilityCheck {
  /**
   * Indica se o veículo está disponível
   */
  isAvailable: boolean;

  /**
   * Razões pelas quais o veículo não está disponível (se aplicável)
   */
  unavailabilityReasons?: string[];

  /**
   * Data/hora da próxima disponibilidade (se aplicável)
   */
  nextAvailableAt?: Date;
}

/**
 * Interface para cálculo de manutenção
 */
export interface MaintenanceCalculation {
  /**
   * Data prevista da próxima manutenção
   */
  nextMaintenanceDate: Date;

  /**
   * Quilometragem prevista da próxima manutenção
   */
  nextMaintenanceMileage: number;

  /**
   * Indica se a manutenção está vencida
   */
  isOverdue: boolean;

  /**
   * Dias até a próxima manutenção (negativo se vencida)
   */
  daysUntilMaintenance: number;

  /**
   * Quilômetros até a próxima manutenção (negativo se vencida)
   */
  kmUntilMaintenance: number;
}

/**
 * Interface para verificação de capacidade de carga
 */
export interface LoadCapacityCheck {
  /**
   * Indica se o veículo pode carregar o peso especificado
   */
  canCarry: boolean;

  /**
   * Capacidade máxima de carga do veículo (em kg)
   */
  maxCapacity: number;

  /**
   * Peso solicitado (em kg)
   */
  requestedWeight: number;

  /**
   * Peso disponível restante (em kg)
   */
  availableCapacity: number;

  /**
   * Percentual de utilização da capacidade (0-100)
   */
  utilizationPercentage: number;
}

/**
 * Interface para atribuição de veículo a entrega
 */
export interface VehicleAssignmentCheck {
  /**
   * Indica se o veículo pode ser atribuído
   */
  canAssign: boolean;

  /**
   * Status do veículo
   */
  vehicleStatus: string;

  /**
   * Validação de documentos
   */
  documentValidation: VehicleDocumentValidationResult;

  /**
   * Verificação de capacidade
   */
  capacityCheck?: LoadCapacityCheck;

  /**
   * Verificação de disponibilidade
   */
  availabilityCheck: VehicleAvailabilityCheck;

  /**
   * Razões pelas quais não pode ser atribuído (se aplicável)
   */
  assignmentBlockers?: string[];
}

/**
 * Interface para estatísticas de utilização de veículo
 */
export interface VehicleUtilizationStats {
  /**
   * ID do veículo
   */
  vehicleId: string;

  /**
   * Número total de entregas realizadas
   */
  totalDeliveries: number;

  /**
   * Quilometragem total percorrida
   */
  totalMileage: number;

  /**
   * Média de entregas por mês
   */
  averageDeliveriesPerMonth: number;

  /**
   * Taxa de utilização (0-100%)
   */
  utilizationRate: number;

  /**
   * Tempo total em operação (em horas)
   */
  totalOperationHours?: number;

  /**
   * Tempo médio por entrega (em horas)
   */
  averageDeliveryTime?: number;
}
