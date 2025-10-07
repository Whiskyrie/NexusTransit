import type { DeliveryStatus } from '../enums/delivery-status.enum';

/**
 * Interface para o body da requisição de atualização de status
 */
export interface UpdateDeliveryStatusBody {
  status?: DeliveryStatus;
  current_status?: DeliveryStatus;
  [key: string]: unknown;
}
