/**
 * Evento disparado quando uma ordem de serviço é cancelada
 */
export class ServiceOrderCancelledEvent {
  constructor(
    public readonly serviceOrderId: string,
    public readonly orderNumber: string,
    public readonly cancelledAt: Date,
    public readonly reason: string,
    public readonly cancelledBy?: string,
  ) {}
}
