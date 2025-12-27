/**
 * Evento disparado quando uma ordem de serviço é agendada
 */
export class ServiceOrderScheduledEvent {
  constructor(
    public readonly serviceOrderId: string,
    public readonly orderNumber: string,
    public readonly scheduledDate: Date,
    public readonly vehicleId?: string,
    public readonly driverId?: string,
  ) {}
}
