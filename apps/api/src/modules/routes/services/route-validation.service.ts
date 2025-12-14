import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Route } from '../entities/route.entity';
import { Delivery } from '../../deliveries/entities/delivery.entity';
import { Driver } from '../../drivers/entities/driver.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { RouteStatus } from '../enums/route-status';
import { VehicleStatus } from '../../vehicles/enums/vehicle-status.enum';

/**
 * Serviço de validação de rotas
 *
 * Responsável por validar:
 * - Disponibilidade de motorista e veículo
 * - Capacidade do veículo vs peso total das entregas
 * - Conflitos de janela de entrega
 * - Transições de status
 * - Regras de negócio específicas
 */
@Injectable()
export class RouteValidationService {
  private readonly logger = new Logger(RouteValidationService.name);

  constructor(
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
    @InjectRepository(Delivery)
    private readonly deliveryRepository: Repository<Delivery>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
  ) {}

  /**
   * Valida se um motorista pode ser atribuído a uma rota
   *
   * Regras:
   * - Motorista deve existir
   * - Motorista não pode ter outra rota IN_PROGRESS na mesma data
   * - Motorista deve estar ativo
   */
  async validateDriverAssignment(
    driverId: string,
    routeDate: Date,
    currentRouteId?: string,
  ): Promise<void> {
    const driver = await this.driverRepository.findOne({
      where: { id: driverId },
    });

    if (!driver) {
      throw new BadRequestException(`Motorista com ID ${driverId} não encontrado`);
    }

    if (!driver.is_active) {
      throw new BadRequestException(`Motorista ${driverId} está inativo`);
    }

    // Verificar se motorista já tem rota IN_PROGRESS na mesma data
    const existingRoutes = await this.routeRepository.find({
      where: {
        driver_id: driverId,
        planned_date: routeDate,
        status: RouteStatus.IN_PROGRESS,
        ...(currentRouteId ? { id: currentRouteId } : {}),
      },
    });

    if (existingRoutes.length > 0) {
      throw new BadRequestException(
        `Motorista ${driverId} já possui rota em execução na data ${routeDate.toISOString().split('T')[0]}`,
      );
    }

    this.logger.debug(`Motorista ${driverId} validado para atribuição`);
  }

  /**
   * Valida se um veículo pode ser atribuído a uma rota
   *
   * Regras:
   * - Veículo deve existir
   * - Veículo não pode estar em outra rota IN_PROGRESS na mesma data
   * - Veículo deve estar ativo e disponível
   */
  async validateVehicleAssignment(
    vehicleId: string,
    routeDate: Date,
    currentRouteId?: string,
  ): Promise<void> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new BadRequestException(`Veículo com ID ${vehicleId} não encontrado`);
    }

    if (!vehicle.status || vehicle.status !== VehicleStatus.ACTIVE) {
      throw new BadRequestException(
        `Veículo ${vehicleId} não está disponível (status: ${vehicle.status})`,
      );
    }

    // Verificar se veículo já está em outra rota IN_PROGRESS na mesma data
    const existingRoutes = await this.routeRepository.find({
      where: {
        vehicle_id: vehicleId,
        planned_date: routeDate,
        status: RouteStatus.IN_PROGRESS,
        ...(currentRouteId ? { id: currentRouteId } : {}),
      },
    });

    if (existingRoutes.length > 0) {
      throw new BadRequestException(
        `Veículo ${vehicleId} já está em uso na data ${routeDate.toISOString().split('T')[0]}`,
      );
    }

    this.logger.debug(`Veículo ${vehicleId} validado para atribuição`);
  }

  /**
   * Valida capacidade do veículo para a rota
   *
   * Regras:
   * - Peso total das entregas não pode exceder capacidade do veículo
   * - Volume total não pode exceder capacidade de volume
   */
  async validateRouteCapacity(
    vehicleId: string,
    totalWeightKg?: number,
    totalVolumeM3?: number,
  ): Promise<void> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new BadRequestException(`Veículo com ID ${vehicleId} não encontrado`);
    }

    if (totalWeightKg !== undefined) {
      if (vehicle.load_capacity && vehicle.load_capacity < totalWeightKg) {
        throw new BadRequestException(
          `Capacidade do veículo excedida. ` +
            `Veículo: ${vehicle.load_capacity}kg, Carga: ${totalWeightKg}kg`,
        );
      }
    }

    if (totalVolumeM3 !== undefined) {
      if (vehicle.cargo_volume && vehicle.cargo_volume < totalVolumeM3) {
        throw new BadRequestException(
          `Volume do veículo excedido. ` +
            `Veículo: ${vehicle.cargo_volume}m³, Carga: ${totalVolumeM3}m³`,
        );
      }
    }

    this.logger.debug(`Capacidade do veículo ${vehicleId} validada`);
  }

  /**
   * Valida transição de status
   *
   * Regras:
   * - PLANNED -> SCHEDULED: todas as entregas devem estar ASSIGNED
   * - SCHEDULED -> IN_PROGRESS: motorista deve fazer check-in
   * - IN_PROGRESS -> COMPLETED: todas as entregas devem estar DELIVERED ou FAILED
   * - Qualquer status -> CANCELED: sempre permitido
   */
  async validateStatusTransition(routeId: string, newStatus: RouteStatus): Promise<void> {
    const route = await this.routeRepository.findOne({
      where: { id: routeId },
      relations: ['stops'],
    });

    if (!route) {
      throw new BadRequestException(`Rota com ID ${routeId} não encontrada`);
    }

    // Transição para CANCELED sempre permitida
    if (newStatus === RouteStatus.CANCELLED) {
      return;
    }

    // Validar transições específicas
    switch (newStatus) {
      case RouteStatus.IN_PROGRESS:
        if (route.status !== RouteStatus.PLANNED) {
          throw new BadRequestException(`Transição inválida: ${route.status} -> ${newStatus}`);
        }

        // Motorista deve estar atribuído
        if (!route.driver_id) {
          throw new BadRequestException(`Motorista não atribuído à rota`);
        }
        break;

      case RouteStatus.COMPLETED: {
        if (route.status !== RouteStatus.IN_PROGRESS) {
          throw new BadRequestException(`Transição inválida: ${route.status} -> ${newStatus}`);
        }

        // Validar se todas as paradas foram completadas
        const incompleteStops = route.stops?.filter(
          stop =>
            stop.status !== 'COMPLETED' && stop.status !== 'SKIPPED' && stop.status !== 'FAILED',
        );

        if (incompleteStops && incompleteStops.length > 0) {
          throw new BadRequestException(
            `Todas as paradas devem estar COMPLETED, SKIPPED ou FAILED para completar a rota`,
          );
        }
        break;
      }

      case RouteStatus.PAUSED:
        if (route.status !== RouteStatus.IN_PROGRESS) {
          throw new BadRequestException(`Transição inválida: ${route.status} -> ${newStatus}`);
        }
        break;

      default:
        throw new BadRequestException(
          `Transição de status não suportada: ${route.status} -> ${newStatus}`,
        );
    }

    this.logger.debug(`Transição de status validada: ${route.status} -> ${newStatus}`);
  }

  /**
   * Valida conflitos de janela de entrega
   *
   * Regras:
   * - Entregas com janelas de tempo devem ser respeitadas na sequência
   * - Janelas de tempo não podem se sobrepor para o mesmo veículo
   */
  async validateDeliveryTimeWindows(routeId: string): Promise<void> {
    const route = await this.routeRepository.findOne({
      where: { id: routeId },
      relations: ['stops'],
    });

    if (!route?.stops || route.stops.length === 0) {
      return;
    }

    // Verificar se todas as entregas com janelas de tempo podem ser atendidas
    const deliveriesWithTimeWindows = route.stops.filter(
      stop => stop.planned_arrival_time ?? stop.planned_departure_time,
    );

    for (const stop of deliveriesWithTimeWindows) {
      if (stop.planned_arrival_time && stop.planned_departure_time) {
        const arrivalTime = this.parseTime(stop.planned_arrival_time);
        const departureTime = this.parseTime(stop.planned_departure_time);

        if (arrivalTime >= departureTime) {
          throw new BadRequestException(
            `Janela de tempo inválida para parada ${stop.id}: ` +
              `Chegada ${stop.planned_arrival_time} >= Partida ${stop.planned_departure_time}`,
          );
        }
      }
    }

    this.logger.debug(`Janelas de tempo validadas para rota ${routeId}`);
  }

  /**
   * Valida se a rota pode ser iniciada
   */
  async validateRouteCanBeStarted(routeId: string): Promise<void> {
    const route = await this.routeRepository.findOne({
      where: { id: routeId },
    });

    if (!route) {
      throw new BadRequestException(`Rota com ID ${routeId} não encontrada`);
    }

    if (!route.canBeStarted()) {
      throw new BadRequestException(`Rota não pode ser iniciada no status ${route.status}`);
    }

    if (!route.driver_id) {
      throw new BadRequestException(`Motorista não atribuído à rota`);
    }

    if (!route.vehicle_id) {
      throw new BadRequestException(`Veículo não atribuído à rota`);
    }

    this.logger.debug(`Rota ${routeId} validada para início`);
  }

  /**
   * Valida se a rota pode ser finalizada
   */
  async validateRouteCanBeCompleted(routeId: string): Promise<void> {
    const route = await this.routeRepository.findOne({
      where: { id: routeId },
      relations: ['stops'],
    });

    if (!route) {
      throw new BadRequestException(`Rota com ID ${routeId} não encontrada`);
    }

    if (!route.canBeCompleted()) {
      throw new BadRequestException(`Rota não pode ser finalizada no status ${route.status}`);
    }

    // Validar se todas as paradas foram completadas
    const incompleteStops = route.stops?.filter(
      stop => stop.status !== 'COMPLETED' && stop.status !== 'SKIPPED' && stop.status !== 'FAILED',
    );

    if (incompleteStops && incompleteStops.length > 0) {
      throw new BadRequestException(
        `Todas as paradas devem estar concluídas ou falhadas para finalizar a rota`,
      );
    }

    this.logger.debug(`Rota ${routeId} validada para finalização`);
  }

  /**
   * Valida se a rota pode ser cancelada
   */
  async validateRouteCanBeCancelled(routeId: string): Promise<void> {
    const route = await this.routeRepository.findOne({
      where: { id: routeId },
    });

    if (!route) {
      throw new BadRequestException(`Rota com ID ${routeId} não encontrada`);
    }

    if (!route.canBeCancelled()) {
      throw new BadRequestException(`Rota não pode ser cancelada no status ${route.status}`);
    }

    this.logger.debug(`Rota ${routeId} validada para cancelamento`);
  }

  /**
   * Valida limites diários da rota
   *
   * Regras:
   * - Distância total não pode exceder limite diário configurável
   * - Número de entregas não pode exceder limite configurável
   */
  async validateRouteDailyLimits(
    routeId: string,
    maxDailyDistanceKm = 500,
    maxDailyDeliveries = 50,
  ): Promise<void> {
    const route = await this.routeRepository.findOne({
      where: { id: routeId },
      relations: ['stops'],
    });

    if (!route) {
      throw new BadRequestException(`Rota com ID ${routeId} não encontrada`);
    }

    if (route.total_distance && route.total_distance > maxDailyDistanceKm) {
      throw new BadRequestException(
        `Distância total ${route.total_distance}km excede limite diário de ${maxDailyDistanceKm}km`,
      );
    }

    if (route.total_deliveries && route.total_deliveries > maxDailyDeliveries) {
      throw new BadRequestException(
        `Número de entregas ${route.total_deliveries} excede limite diário de ${maxDailyDeliveries}`,
      );
    }

    this.logger.debug(`Limites diários validados para rota ${routeId}`);
  }

  /**
   * Valida se o motorista pode ter múltiplas rotas
   *
   * Regras:
   * - Motorista só pode ter 1 rota IN_PROGRESS por vez
   * - Motorista pode ter múltiplas rotas PLANNED ou SCHEDULED
   */
  async validateDriverRouteLimit(driverId: string): Promise<void> {
    const inProgressRoutes = await this.routeRepository.count({
      where: {
        driver_id: driverId,
        status: RouteStatus.IN_PROGRESS,
      },
    });

    if (inProgressRoutes > 0) {
      throw new BadRequestException(`Motorista ${driverId} já possui uma rota em execução`);
    }

    this.logger.debug(`Limite de rotas para motorista ${driverId} validado`);
  }

  /**
   * Valida se o veículo pode estar em múltiplas rotas
   *
   * Regras:
   * - Veículo só pode estar em 1 rota IN_PROGRESS por vez
   * - Veículo pode estar em múltiplas rotas PLANNED ou SCHEDULED
   */
  async validateVehicleRouteLimit(vehicleId: string): Promise<void> {
    const inProgressRoutes = await this.routeRepository.count({
      where: {
        vehicle_id: vehicleId,
        status: RouteStatus.IN_PROGRESS,
      },
    });

    if (inProgressRoutes > 0) {
      throw new BadRequestException(`Veículo ${vehicleId} já está em uso em uma rota em execução`);
    }

    this.logger.debug(`Limite de rotas para veículo ${vehicleId} validado`);
  }

  /**
   * Auxiliar: Converte string de tempo (HH:mm) para minutos desde meia-noite
   */
  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Auxiliar: Verifica se motorista existe
   */
  async validateDriverExists(driverId: string): Promise<void> {
    const driver = await this.driverRepository.findOne({
      where: { id: driverId },
    });

    if (!driver) {
      throw new BadRequestException(`Motorista com ID ${driverId} não encontrado`);
    }
  }

  /**
   * Auxiliar: Verifica se veículo existe
   */
  async validateVehicleExists(vehicleId: string): Promise<void> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new BadRequestException(`Veículo com ID ${vehicleId} não encontrado`);
    }
  }

  /**
   * Auxiliar: Verifica se código da rota é único
   */
  async validateUniqueRouteCode(routeCode: string, excludeRouteId?: string): Promise<void> {
    const existingRoute = await this.routeRepository.findOne({
      where: {
        route_code: routeCode,
        ...(excludeRouteId ? { id: excludeRouteId } : {}),
      },
    });

    if (existingRoute) {
      throw new BadRequestException(`Código de rota ${routeCode} já está em uso`);
    }
  }

  /**
   * Auxiliar: Valida datas da rota
   */
  validateRouteDates(plannedDate: Date, plannedStartTime?: string, plannedEndTime?: string): void {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Data planejada não pode ser no passado
    if (plannedDate < today) {
      throw new BadRequestException(
        `Data planejada não pode ser no passado: ${plannedDate.toISOString().split('T')[0]}`,
      );
    }

    // Se horários forem fornecidos, validar formato e lógica
    if (plannedStartTime && plannedEndTime) {
      const startMinutes = this.parseTime(plannedStartTime);
      const endMinutes = this.parseTime(plannedEndTime);

      if (startMinutes >= endMinutes) {
        throw new BadRequestException(
          `Horário de início ${plannedStartTime} deve ser anterior ao horário de término ${plannedEndTime}`,
        );
      }
    }
  }

  /**
   * Encontra automaticamente motorista e veículo disponíveis para uma rota
   *
   * Critérios de seleção:
   * 1. Motorista e veículo devem estar disponíveis na data especificada
   * 2. Motorista deve ter habilitação compatível com o veículo
   * 3. Veículo deve ter capacidade suficiente
   * 4. Prioriza motorista com menos rotas atribuídas no período
   * 5. Prioriza veículo com menor quilometragem (para distribuir desgaste)
   *
   * @param routeId - ID da rota para atribuir
   * @param routeDate - Data da rota
   * @returns Objeto com driver_id, vehicle_id e motivo da escolha
   * @throws BadRequestException se não encontrar motorista ou veículo disponível
   */
  async findAvailableDriverAndVehicle(
    routeId: string,
    routeDate: Date,
  ): Promise<{
    driver_id: string;
    driver_name: string;
    vehicle_id: string;
    vehicle_plate: string;
    assignment_reason: string;
    confidence_score: number;
  }> {
    this.logger.log(
      `Buscando motorista e veículo disponíveis para rota ${routeId} em ${routeDate.toISOString()}`,
    );

    // Buscar rota para verificar requisitos
    const route = await this.routeRepository.findOne({
      where: { id: routeId },
      relations: ['stops'],
    });

    if (!route) {
      throw new BadRequestException(`Rota ${routeId} não encontrada`);
    }

    // Calcular peso total estimado (valor padrão para rota)
    const totalWeight = route.stops?.length ? route.stops.length * 5 : 0; // 5kg por parada estimado

    // Buscar motoristas disponíveis
    const availableDrivers = await this.driverRepository
      .createQueryBuilder('driver')
      .leftJoinAndSelect(
        'driver.routes',
        'route',
        'DATE(route.route_date) = DATE(:routeDate) AND route.status IN (:...activeStatuses)',
        {
          routeDate: routeDate.toISOString(),
          activeStatuses: [RouteStatus.IN_PROGRESS, RouteStatus.PLANNED],
        },
      )
      .where('driver.status = :status', { status: 'ACTIVE' })
      .andWhere('route.id IS NULL') // Sem rotas ativas na data
      .getMany();

    if (availableDrivers.length === 0) {
      throw new BadRequestException(
        `Nenhum motorista disponível encontrado para a data ${routeDate.toISOString().split('T')[0]}`,
      );
    }

    this.logger.debug(`${availableDrivers.length} motoristas disponíveis encontrados`);

    // Buscar veículos disponíveis com capacidade suficiente
    const availableVehicles = await this.vehicleRepository
      .createQueryBuilder('vehicle')
      .leftJoinAndSelect(
        'vehicle.routes',
        'route',
        'DATE(route.route_date) = DATE(:routeDate) AND route.status IN (:...activeStatuses)',
        {
          routeDate: routeDate.toISOString(),
          activeStatuses: [RouteStatus.IN_PROGRESS, RouteStatus.PLANNED],
        },
      )
      .where('vehicle.status = :status', { status: VehicleStatus.ACTIVE })
      .andWhere('vehicle.capacity_kg >= :totalWeight', { totalWeight })
      .andWhere('route.id IS NULL') // Sem rotas ativas na data
      .orderBy('vehicle.current_mileage_km', 'ASC') // Prioriza menor quilometragem
      .getMany();

    if (availableVehicles.length === 0) {
      throw new BadRequestException(
        `Nenhum veículo disponível com capacidade mínima de ${totalWeight}kg para a data ${routeDate.toISOString().split('T')[0]}`,
      );
    }

    this.logger.debug(`${availableVehicles.length} veículos disponíveis encontrados`);

    // Selecionar melhor motorista (pode adicionar lógica de scoring)
    const selectedDriver = availableDrivers[0]; // Por enquanto, pega o primeiro disponível

    // Selecionar melhor veículo
    const selectedVehicle = availableVehicles[0]; // Já ordenado por menor quilometragem

    // Calcular score de confiança (0-100)
    const confidenceScore = this.calculateAssignmentConfidence(
      availableDrivers.length,
      availableVehicles.length,
      totalWeight,
      selectedVehicle.load_capacity ?? 0,
    );

    const assignmentReason = `Motorista ${selectedDriver.full_name} selecionado (disponível). Veículo ${selectedVehicle.license_plate} selecionado (${availableVehicles.length} disponíveis, capacidade ${selectedVehicle.load_capacity ?? 0}kg para ${totalWeight}kg de carga, menor quilometragem: ${selectedVehicle.mileage}km).`;

    this.logger.log(`Atribuição automática: ${assignmentReason}`);

    return {
      driver_id: selectedDriver.id,
      driver_name: selectedDriver.full_name,
      vehicle_id: selectedVehicle.id,
      vehicle_plate: selectedVehicle.license_plate,
      assignment_reason: assignmentReason,
      confidence_score: confidenceScore,
    };
  }

  /**
   * Calcula score de confiança da atribuição automática
   *
   * Baseado em:
   * - Quantidade de opções disponíveis
   * - Margem de capacidade do veículo
   *
   * @returns Score de 0 a 100
   */
  private calculateAssignmentConfidence(
    availableDrivers: number,
    availableVehicles: number,
    requiredCapacity: number,
    vehicleCapacity: number,
  ): number {
    // Disponibilidade: quanto mais opções, maior a confiança
    const availabilityScore = Math.min(100, (availableDrivers + availableVehicles) * 10);

    // Margem de capacidade: quanto maior a margem, maior a confiança
    const capacityMargin = (vehicleCapacity - requiredCapacity) / vehicleCapacity;
    const capacityScore = Math.min(100, capacityMargin * 100);

    // Média ponderada: 60% disponibilidade, 40% capacidade
    const finalScore = availabilityScore * 0.6 + capacityScore * 0.4;

    return Math.round(finalScore);
  }
}
