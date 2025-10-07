import type { DriverStatus } from '../enums/driver-status.enum';

/**
 * Interface para estatísticas de desempenho do motorista
 */
export interface DriverPerformance {
  driverId: string;
  totalDeliveries: number;
  completedDeliveries: number;
  failedDeliveries: number;
  cancelledDeliveries: number;
  successRate: number;
  averageDeliveryTime: number; // em minutos
  totalDistance: number; // em km
  totalWorkingHours: number;
  onTimeDeliveryRate: number;
  customerRating?: number;
  lastDeliveryAt?: Date;
}

/**
 * Interface para disponibilidade do motorista
 */
export interface DriverAvailability {
  driverId: string;
  currentStatus: DriverStatus;
  isAvailable: boolean;
  nextAvailableAt?: Date;
  blockedUntil?: Date;
  vacationUntil?: Date;
  currentRoute?: {
    id: string;
    startedAt: Date;
    expectedEndAt?: Date;
    remainingStops: number;
  };
}

/**
 * Interface para capacitação do motorista
 */
export interface DriverCapabilities {
  driverId: string;
  cnhCategory: string;
  canTransportDangerousGoods: boolean; // MOPP
  hasRefrigeratedTransportCertification: boolean;
  hasHeavyLoadCertification: boolean;
  languages: string[];
  specialSkills: string[];
  vehicleTypes: string[];
}

/**
 * Interface para métricas do motorista
 */
export interface DriverMetrics {
  performance: DriverPerformance;
  availability: DriverAvailability;
  capabilities: DriverCapabilities;
  compliance: {
    documentsUpToDate: boolean;
    cnhValid: boolean;
    trainingComplete: boolean;
    lastAuditDate?: Date;
  };
}
