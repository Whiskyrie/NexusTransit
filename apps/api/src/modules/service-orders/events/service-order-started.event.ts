/**
 * Evento disparado quando uma ordem de serviço é iniciada
 */
export class ServiceOrderStartedEvent {
  constructor(
    public readonly serviceOrderId: string,
    public readonly orderNumber: string,
    public readonly startedAt: Date,
    public readonly driverId?: string,
    public readonly vehicleId?: string,
  ) {}
}
