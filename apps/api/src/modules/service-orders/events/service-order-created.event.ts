/**
 * Evento disparado quando uma ordem de serviço é criada
 */
export class ServiceOrderCreatedEvent {
  constructor(
    public readonly serviceOrderId: string,
    public readonly orderNumber: string,
    public readonly customerId?: string,
    public readonly serviceType?: string,
    public readonly priority?: string,
    public readonly createdBy?: string,
  ) {}
}
