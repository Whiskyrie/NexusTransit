/**
 * Evento disparado quando uma ordem de serviço é concluída
 */
export class ServiceOrderCompletedEvent {
  constructor(
    public readonly serviceOrderId: string,
    public readonly orderNumber: string,
    public readonly completedAt: Date,
    public readonly actualCost?: number,
    public readonly durationMinutes?: number,
    public readonly report?: string,
  ) {}
}
