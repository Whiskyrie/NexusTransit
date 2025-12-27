import type { OrderStatus } from '../enums/service_order-status';

/**
 * Evento genérico disparado em qualquer mudança de status
 */
export class ServiceOrderStatusChangedEvent {
  constructor(
    public readonly serviceOrderId: string,
    public readonly orderNumber: string,
    public readonly previousStatus: OrderStatus,
    public readonly newStatus: OrderStatus,
    public readonly changedAt: Date,
    public readonly changedBy?: string,
    public readonly reason?: string,
  ) {}
}
