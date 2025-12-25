/**
 * Evento disparado quando uma entrega é gerada a partir de uma ordem de serviço
 */
export class DeliveryGeneratedEvent {
  constructor(
    public readonly serviceOrderId: string,
    public readonly orderNumber: string,
    public readonly deliveryId: string,
    public readonly trackingCode: string,
    public readonly generatedAt: Date,
  ) {}
}
