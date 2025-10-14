import type { DriverStatus } from '../enums/driver-status.enum';

/**
 * Interface para o body da requisição de atualização de status
 */
export interface UpdateDriverStatusBody {
  status?: DriverStatus;
  current_status?: DriverStatus;
  reason?: string;
  [key: string]: unknown;
}

/**
 * Interface para histórico de mudança de status
 */
export interface DriverStatusHistory {
  id: string;
  driverId: string;
  oldStatus: DriverStatus;
  newStatus: DriverStatus;
  changedBy?: string;
  changedAt: Date;
  reason?: string;
  metadata?: Record<string, unknown>;
}
