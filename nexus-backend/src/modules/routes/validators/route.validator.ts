import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { Route } from '../entities/route.entity';
import { RouteStatus } from '../enums/route-status';
import { isValidStatusTransition } from '../enums/route-status';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { VehicleStatus } from '../../vehicles/enums/vehicle-status.enum';
import { Driver } from '../../drivers/entities/driver.entity';

/**
 * Service de validação de rotas
 *
 * Responsabilidades:
 * - Validar regra: motorista apenas uma rota ativa por vez
 * - Validar disponibilidade de veículo
 * - Validar transições de status
 * - Validar dados de criação/atualização
 */
@Injectable()
export class RouteValidatorService {
  constructor(
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
  ) {}

  /**
   * Valida se motorista pode ser atribuído a uma nova rota
   * 
   * Regra: Motorista pode ter apenas UMA rota ativa por vez
   * Status ativos: PLANNED, IN_PROGRESS, PAUSED
   * 
   * @throws ConflictException se motorista já tem rota ativa
   */
  async validateDriverAssignment(driverId: string, plannedDate: Date, excludeRouteId?: string): Promise<void> {
    const whereConditions: any = {
      driver_id: driverId,
      status: In([RouteStatus.PLANNED, RouteStatus.IN_PROGRESS, RouteStatus.PAUSED]),
    };

    if (excludeRouteId) {
      whereConditions.id = Not(excludeRouteId);
    }

    const existingRoute = await this.routeRepository.findOne({
      where: whereConditions,
      relations: ['driver'],
    });

    if (existingRoute) {
      throw new ConflictException(
        `Motorista já possui uma rota ativa (${existingRoute.route_code}) com status ${existingRoute.status}. ` +
        `Finalize ou cancele a rota anterior antes de atribuir uma nova.`
      );
    }
  }

  /**
   * Valida se veículo pode ser atribuído a uma nova rota
   */
  async validateVehicleAssignment(vehicleId: string, plannedDate: Date, excludeRouteId?: string): Promise<void> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(`Veículo com ID ${vehicleId} não encontrado`);
    }

    // Verificar status do veículo
    if (vehicle.status === VehicleStatus.MAINTENANCE) {
      throw new ConflictException(`Veículo ${vehicle.license_plate} está em manutenção`);
    }

    if (vehicle.status === VehicleStatus.INACTIVE) {
      throw new ConflictException(`Veículo ${vehicle.license_plate} está inativo`);
    }

    if (vehicle.status === VehicleStatus.OUT_OF_SERVICE) {
      throw new ConflictException(`Veículo ${vehicle.license_plate} está fora de serviço`);
    }

    // Verificar se veículo já está em rota ativa
    const whereConditions: any = {
      vehicle_id: vehicleId,
      status: In([RouteStatus.PLANNED, RouteStatus.IN_PROGRESS, RouteStatus.PAUSED]),
    };

    if (excludeRouteId) {
      whereConditions.id = Not(excludeRouteId);
    }

    const existingRoute = await this.routeRepository.findOne({
      where: whereConditions,
    });

    if (existingRoute) {
      throw new ConflictException(
        `Veículo ${vehicle.license_plate} já está atribuído à rota ${existingRoute.route_code}`
      );
    }
  }

  /**
   * Valida se motorista existe e está ativo
   */
  async validateDriverExists(driverId: string): Promise<Driver> {
    const driver = await this.driverRepository.findOne({
      where: { id: driverId },
    });

    if (!driver) {
      throw new NotFoundException(`Motorista com ID ${driverId} não encontrado`);
    }

    if (!driver.is_active) {
      throw new BadRequestException(`Motorista ${driver.full_name} está inativo`);
    }

    return driver;
  }

  /**
   * Valida se veículo existe e está ativo
   */
  async validateVehicleExists(vehicleId: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(`Veículo com ID ${vehicleId} não encontrado`);
    }

    if (vehicle.status === VehicleStatus.INACTIVE) {
      throw new BadRequestException(`Veículo ${vehicle.license_plate} está inativo`);
    }

    return vehicle;
  }

  /**
   * Valida transição de status
   */
  validateStatusTransition(currentStatus: RouteStatus, newStatus: RouteStatus): void {
    if (!isValidStatusTransition(currentStatus, newStatus)) {
      throw new BadRequestException(
        `Transição de status inválida: ${currentStatus} → ${newStatus}`
      );
    }
  }

  /**
   * Valida código único da rota
   */
  async validateUniqueRouteCode(routeCode: string, excludeRouteId?: string): Promise<void> {
    const whereConditions: any = { route_code: routeCode };

    if (excludeRouteId) {
      whereConditions.id = Not(excludeRouteId);
    }

    const existing = await this.routeRepository.findOne({
      where: whereConditions,
    });

    if (existing) {
      throw new ConflictException(`Código de rota ${routeCode} já está em uso`);
    }
  }

  /**
   * Valida datas da rota
   */
  validateRouteDates(
    plannedDate: Date,
    plannedStartTime?: string,
    plannedEndTime?: string,
  ): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const planned = new Date(plannedDate);
    planned.setHours(0, 0, 0, 0);

    if (planned < today) {
      throw new BadRequestException('Data planejada não pode ser no passado');
    }

    if (plannedStartTime && plannedEndTime) {
      const startParts = plannedStartTime.split(':');
      const endParts = plannedEndTime.split(':');

      if (startParts.length !== 2 || endParts.length !== 2) {
        throw new BadRequestException('Formato de horário inválido. Use HH:mm');
      }

      // Garantir que os índices existem antes de usar
      const startHourStr = startParts[0];
      const startMinStr = startParts[1];
      const endHourStr = endParts[0];
      const endMinStr = endParts[1];

      if (!startHourStr || !startMinStr || !endHourStr || !endMinStr) {
        throw new BadRequestException('Formato de horário inválido. Use HH:mm');
      }

      const startHour = parseInt(startHourStr, 10);
      const startMin = parseInt(startMinStr, 10);
      const endHour = parseInt(endHourStr, 10);
      const endMin = parseInt(endMinStr, 10);

      if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
        throw new BadRequestException('Horários devem conter apenas números');
      }

      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (endMinutes <= startMinutes) {
        throw new BadRequestException(
          'Horário de término deve ser posterior ao horário de início'
        );
      }
    }
  }

  /**
   * Valida capacidade do veículo vs carga da rota
   * 
   * Usa as propriedades CORRETAS da entidade Vehicle:
   * - load_capacity (não load_capacity_kg)
   * - cargo_volume (não volume_capacity_m3)
   */
  async validateRouteCapacity(
    vehicleId: string,
    totalLoadKg?: number,
    totalVolumeM3?: number,
  ): Promise<void> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(`Veículo com ID ${vehicleId} não encontrado`);
    }

    // Validar peso usando load_capacity (propriedade REAL)
    if (totalLoadKg && vehicle.load_capacity && totalLoadKg > vehicle.load_capacity) {
      throw new BadRequestException(
        `Carga total (${totalLoadKg}kg) excede capacidade do veículo (${vehicle.load_capacity}kg)`
      );
    }

    // Validar volume usando cargo_volume (propriedade REAL)
    if (totalVolumeM3 && vehicle.cargo_volume && totalVolumeM3 > vehicle.cargo_volume) {
      throw new BadRequestException(
        `Volume total (${totalVolumeM3}m³) excede capacidade do veículo (${vehicle.cargo_volume}m³)`
      );
    }
  }
}