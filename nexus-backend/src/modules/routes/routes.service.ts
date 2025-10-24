import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike, Between } from 'typeorm';
import { Route } from './entities/route.entity';
import { RouteStop } from './entities/route_stop.entity';
import { RouteHistory } from './entities/route_history.entity';
import { CreateRouteDto, CreateRouteStopDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { RouteFilterDto } from './dto/filter-route.dto';
import { RouteResponseDto } from './dto/route-response.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { RouteValidatorService } from './validators/route.validator';
import { DistanceCalculatorService } from './validators/distance_calculator.validator';
import { RouteStatus } from './enums/route-status';
import { RouteType } from './enums/route-type';

interface ChangedField {
  field_name: string;
  old_value: unknown;
  new_value: unknown;
}

@Injectable()
export class RoutesService {
  private readonly logger = new Logger(RoutesService.name);

  constructor(
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
    @InjectRepository(RouteStop)
    private readonly routeStopRepository: Repository<RouteStop>,
    @InjectRepository(RouteHistory)
    private readonly routeHistoryRepository: Repository<RouteHistory>,
    private readonly validatorService: RouteValidatorService,
    private readonly distanceCalculator: DistanceCalculatorService,
  ) {}

  async create(createDto: CreateRouteDto): Promise<RouteResponseDto> {
    this.logger.log(`Criando rota: ${createDto.route_code}`);

    await this.validatorService.validateUniqueRouteCode(createDto.route_code);
    await this.validatorService.validateDriverExists(createDto.driver_id);
    await this.validatorService.validateDriverAssignment(
      createDto.driver_id,
      new Date(createDto.planned_date),
    );

    await this.validatorService.validateVehicleExists(createDto.vehicle_id);
    await this.validatorService.validateVehicleAssignment(
      createDto.vehicle_id,
      new Date(createDto.planned_date),
    );

    this.validatorService.validateRouteDates(
      new Date(createDto.planned_date),
      createDto.planned_start_time,
      createDto.planned_end_time,
    );

    if (createDto.total_load_kg || createDto.total_volume_m3) {
      await this.validatorService.validateRouteCapacity(
        createDto.vehicle_id,
        createDto.total_load_kg,
        createDto.total_volume_m3,
      );
    }

    let calculatedDistance: number | undefined;
    let calculatedDuration: number | undefined;

    if (createDto.origin_coordinates && createDto.destination_coordinates) {
      calculatedDistance = this.distanceCalculator.calculateDistance(
        createDto.origin_coordinates,
        createDto.destination_coordinates,
      );

      const characteristics = this.getRouteTypeCharacteristics(createDto.type);
      calculatedDuration = this.distanceCalculator.calculateEstimatedDuration(
        calculatedDistance,
        characteristics.avgSpeed,
        characteristics.delayFactor,
      );
    }

    const { stops, ...routeData } = createDto;

    // Criar objeto LIMPO - sem campos undefined
    const preparedData: Partial<Route> = {
      route_code: routeData.route_code,
      name: routeData.name,
      vehicle_id: routeData.vehicle_id,
      driver_id: routeData.driver_id,
      type: routeData.type,
      origin_address: routeData.origin_address,
      destination_address: routeData.destination_address,
      planned_date: new Date(createDto.planned_date),
    };

    // Adicionar campos opcionais APENAS se tiverem valor
    if (routeData.description) {
      preparedData.description = routeData.description;
    }
    if (routeData.status) {
      preparedData.status = routeData.status;
    }
    if (routeData.origin_coordinates) {
      preparedData.origin_coordinates = routeData.origin_coordinates;
    }
    if (routeData.destination_coordinates) {
      preparedData.destination_coordinates = routeData.destination_coordinates;
    }
    if (routeData.planned_start_time) {
      preparedData.planned_start_time = routeData.planned_start_time;
    }
    if (routeData.planned_end_time) {
      preparedData.planned_end_time = routeData.planned_end_time;
    }
    if (routeData.total_load_kg) {
      preparedData.total_load_kg = routeData.total_load_kg;
    }
    if (routeData.total_volume_m3) {
      preparedData.total_volume_m3 = routeData.total_volume_m3;
    }
    if (routeData.difficulty_level) {
      preparedData.difficulty_level = routeData.difficulty_level;
    }
    if (routeData.notes) {
      preparedData.notes = routeData.notes;
    }

    // Adicionar valores calculados
    const finalDistance = routeData.estimated_distance_km ?? calculatedDistance;
    if (finalDistance !== undefined) {
      preparedData.estimated_distance_km = finalDistance;
    }

    const finalDuration = routeData.estimated_duration_minutes ?? calculatedDuration;
    if (finalDuration !== undefined) {
      preparedData.estimated_duration_minutes = finalDuration;
    }

    const route = this.routeRepository.create(preparedData);
    const savedRoute = await this.routeRepository.save(route);

    if (stops && stops.length > 0) {
      await this.createRouteStops(savedRoute.id, stops);
    }

    await this.createHistoryEntry(savedRoute.id, {
      event_type: 'ROUTE_CREATED',
      description: `Rota ${savedRoute.route_code} criada`,
      new_status: savedRoute.status,
    });

    this.logger.log(`Rota criada: ${savedRoute.id} - ${savedRoute.route_code}`);

    return this.findOne(savedRoute.id);
  }

  async findAll(filterDto: RouteFilterDto): Promise<PaginatedResponseDto<RouteResponseDto>> {
    const { page = 1, limit = 10, search, ...filters } = filterDto;

    const where: FindOptionsWhere<Route> = {};

    if (search) {
      where.name = ILike(`%${search}%`);
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.vehicle_id) {
      where.vehicle_id = filters.vehicle_id;
    }

    if (filters.driver_id) {
      where.driver_id = filters.driver_id;
    }

    if (filters.planned_date_from || filters.planned_date_to) {
      const startDate = filters.planned_date_from
        ? new Date(filters.planned_date_from)
        : new Date('1900-01-01');
      const endDate = filters.planned_date_to
        ? new Date(filters.planned_date_to)
        : new Date('2100-12-31');

      where.planned_date = Between(startDate, endDate);
    }

    const [routes, total] = await this.routeRepository.findAndCount({
      where,
      relations: ['vehicle', 'driver', 'stops'],
      take: limit,
      skip: (page - 1) * limit,
      order: { planned_date: 'DESC', created_at: 'DESC' },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: routes.map(route => this.mapToResponseDto(route)),
      meta: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_previous: page > 1,
        has_next: page < totalPages,
      },
    };
  }

  async findOne(id: string): Promise<RouteResponseDto> {
    const route = await this.routeRepository.findOne({
      where: { id },
      relations: ['vehicle', 'driver', 'stops', 'stops.customer_address'],
    });

    if (!route) {
      throw new NotFoundException(`Rota com ID ${id} não encontrada`);
    }

    return this.mapToResponseDto(route);
  }

  async update(id: string, updateDto: UpdateRouteDto): Promise<RouteResponseDto> {
    const route = await this.findRouteOrFail(id);

    this.logger.log(`Atualizando rota: ${id}`);

    if (!route.canBeEdited() && Object.keys(updateDto).length > 0) {
      throw new BadRequestException(
        `Rota não pode ser editada no status ${route.status}. Apenas rotas PLANNED podem ser editadas.`,
      );
    }

    if (updateDto.route_code && updateDto.route_code !== route.route_code) {
      await this.validatorService.validateUniqueRouteCode(updateDto.route_code, id);
    }

    if (updateDto.driver_id && updateDto.driver_id !== route.driver_id) {
      await this.validatorService.validateDriverExists(updateDto.driver_id);
      await this.validatorService.validateDriverAssignment(
        updateDto.driver_id,
        route.planned_date,
        id,
      );
    }

    if (updateDto.vehicle_id && updateDto.vehicle_id !== route.vehicle_id) {
      await this.validatorService.validateVehicleExists(updateDto.vehicle_id);
      await this.validatorService.validateVehicleAssignment(
        updateDto.vehicle_id,
        route.planned_date,
        id,
      );
    }

    if (updateDto.planned_date || updateDto.planned_start_time || updateDto.planned_end_time) {
      this.validatorService.validateRouteDates(
        updateDto.planned_date ? new Date(updateDto.planned_date) : route.planned_date,
        updateDto.planned_start_time ?? route.planned_start_time,
        updateDto.planned_end_time ?? route.planned_end_time,
      );
    }

    const changedFields = this.getChangedFields(route, updateDto);

    if (updateDto.route_code) {
      route.route_code = updateDto.route_code;
    }
    if (updateDto.name) {
      route.name = updateDto.name;
    }
    if (updateDto.description !== undefined) {
      route.description = updateDto.description;
    }
    if (updateDto.vehicle_id) {
      route.vehicle_id = updateDto.vehicle_id;
    }
    if (updateDto.driver_id) {
      route.driver_id = updateDto.driver_id;
    }
    if (updateDto.status) {
      route.status = updateDto.status;
    }
    if (updateDto.type) {
      route.type = updateDto.type;
    }
    if (updateDto.origin_address) {
      route.origin_address = updateDto.origin_address;
    }
    if (updateDto.origin_coordinates !== undefined) {
      route.origin_coordinates = updateDto.origin_coordinates;
    }
    if (updateDto.destination_address) {
      route.destination_address = updateDto.destination_address;
    }
    if (updateDto.destination_coordinates !== undefined) {
      route.destination_coordinates = updateDto.destination_coordinates;
    }
    if (updateDto.planned_date) {
      route.planned_date = new Date(updateDto.planned_date);
    }
    if (updateDto.planned_start_time !== undefined) {
      route.planned_start_time = updateDto.planned_start_time;
    }
    if (updateDto.planned_end_time !== undefined) {
      route.planned_end_time = updateDto.planned_end_time;
    }
    if (updateDto.estimated_distance_km !== undefined) {
      route.estimated_distance_km = updateDto.estimated_distance_km;
    }
    if (updateDto.estimated_duration_minutes !== undefined) {
      route.estimated_duration_minutes = updateDto.estimated_duration_minutes;
    }
    if (updateDto.total_load_kg !== undefined) {
      route.total_load_kg = updateDto.total_load_kg;
    }
    if (updateDto.total_volume_m3 !== undefined) {
      route.total_volume_m3 = updateDto.total_volume_m3;
    }
    if (updateDto.difficulty_level !== undefined) {
      route.difficulty_level = updateDto.difficulty_level;
    }
    if (updateDto.notes !== undefined) {
      route.notes = updateDto.notes;
    }

    await this.routeRepository.save(route);

    if (changedFields.length > 0) {
      await this.createHistoryEntry(id, {
        event_type: 'ROUTE_UPDATED',
        description: `Rota ${route.route_code} atualizada`,
        changed_fields: changedFields,
      });
    }

    this.logger.log(`Rota atualizada: ${id}`);

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const route = await this.findRouteOrFail(id);

    if (route.status === RouteStatus.IN_PROGRESS) {
      throw new BadRequestException('Não é possível remover uma rota em execução');
    }

    await this.routeRepository.softRemove(route);

    await this.createHistoryEntry(id, {
      event_type: 'ROUTE_DELETED',
      description: `Rota ${route.route_code} removida`,
    });

    this.logger.log(`Rota removida: ${id}`);
  }

  async startRoute(id: string): Promise<RouteResponseDto> {
    const route = await this.findRouteOrFail(id);

    if (!route.canBeStarted()) {
      throw new BadRequestException(`Rota não pode ser iniciada no status ${route.status}`);
    }

    route.status = RouteStatus.IN_PROGRESS;
    route.actual_start_time = new Date();

    await this.routeRepository.save(route);

    await this.createHistoryEntry(id, {
      event_type: 'STATUS_CHANGED',
      description: 'Rota iniciada',
      previous_status: RouteStatus.PLANNED,
      new_status: RouteStatus.IN_PROGRESS,
    });

    this.logger.log(`Rota iniciada: ${id}`);

    return this.findOne(id);
  }

  async pauseRoute(id: string): Promise<RouteResponseDto> {
    const route = await this.findRouteOrFail(id);

    if (!route.canBePaused()) {
      throw new BadRequestException(`Rota não pode ser pausada no status ${route.status}`);
    }

    route.status = RouteStatus.PAUSED;

    await this.routeRepository.save(route);

    await this.createHistoryEntry(id, {
      event_type: 'STATUS_CHANGED',
      description: 'Rota pausada',
      previous_status: RouteStatus.IN_PROGRESS,
      new_status: RouteStatus.PAUSED,
    });

    this.logger.log(`Rota pausada: ${id}`);

    return this.findOne(id);
  }

  async resumeRoute(id: string): Promise<RouteResponseDto> {
    const route = await this.findRouteOrFail(id);

    if (!route.canBeResumed()) {
      throw new BadRequestException(`Rota não pode ser retomada no status ${route.status}`);
    }

    route.status = RouteStatus.IN_PROGRESS;

    await this.routeRepository.save(route);

    await this.createHistoryEntry(id, {
      event_type: 'STATUS_CHANGED',
      description: 'Rota retomada',
      previous_status: RouteStatus.PAUSED,
      new_status: RouteStatus.IN_PROGRESS,
    });

    this.logger.log(`Rota retomada: ${id}`);

    return this.findOne(id);
  }

  async completeRoute(id: string): Promise<RouteResponseDto> {
    const route = await this.findRouteOrFail(id);

    if (!route.canBeCompleted()) {
      throw new BadRequestException(`Rota não pode ser finalizada no status ${route.status}`);
    }

    route.status = RouteStatus.COMPLETED;
    route.actual_end_time = new Date();

    if (route.actual_start_time) {
      const durationMs = route.actual_end_time.getTime() - route.actual_start_time.getTime();
      route.actual_duration_minutes = Math.floor(durationMs / (1000 * 60));
    }

    await this.routeRepository.save(route);

    await this.createHistoryEntry(id, {
      event_type: 'STATUS_CHANGED',
      description: 'Rota finalizada',
      previous_status: RouteStatus.IN_PROGRESS,
      new_status: RouteStatus.COMPLETED,
    });

    this.logger.log(`Rota finalizada: ${id}`);

    return this.findOne(id);
  }

  async cancelRoute(id: string, reason: string): Promise<RouteResponseDto> {
    const route = await this.findRouteOrFail(id);

    if (!route.canBeCancelled()) {
      throw new BadRequestException(`Rota não pode ser cancelada no status ${route.status}`);
    }

    const previousStatus = route.status;
    route.status = RouteStatus.CANCELLED;
    route.cancellation_reason = reason;
    route.cancelled_at = new Date();

    await this.routeRepository.save(route);

    await this.createHistoryEntry(id, {
      event_type: 'STATUS_CHANGED',
      description: `Rota cancelada: ${reason}`,
      previous_status: previousStatus,
      new_status: RouteStatus.CANCELLED,
    });

    this.logger.log(`Rota cancelada: ${id} - Motivo: ${reason}`);

    return this.findOne(id);
  }

  private async findRouteOrFail(id: string): Promise<Route> {
    const route = await this.routeRepository.findOne({
      where: { id },
      relations: ['stops'],
    });

    if (!route) {
      throw new NotFoundException(`Rota com ID ${id} não encontrada`);
    }

    return route;
  }

  private async createRouteStops(routeId: string, stopsDto: CreateRouteStopDto[]): Promise<void> {
    for (const stopDto of stopsDto) {
      const stop = this.routeStopRepository.create({
        route_id: routeId,
        ...stopDto,
      });
      await this.routeStopRepository.save(stop);
    }
  }

  private async createHistoryEntry(
    routeId: string,
    data: {
      event_type: string;
      description: string;
      previous_status?: RouteStatus;
      new_status?: RouteStatus;
      changed_fields?: ChangedField[];
    },
  ): Promise<void> {
    const history = this.routeHistoryRepository.create({
      route_id: routeId,
      ...data,
    });

    await this.routeHistoryRepository.save(history);
  }

  private getChangedFields(original: Route, updated: UpdateRouteDto): ChangedField[] {
    const changed: ChangedField[] = [];

    (Object.keys(updated) as (keyof UpdateRouteDto)[]).forEach(key => {
      const oldValue = original[key as keyof Route];
      const newValue = updated[key];

      if (oldValue !== newValue && newValue !== undefined) {
        changed.push({
          field_name: key,
          old_value: oldValue,
          new_value: newValue,
        });
      }
    });

    return changed;
  }

  private getRouteTypeCharacteristics(type: RouteType): {
    avgSpeed: number;
    delayFactor: number;
  } {
    const characteristics = {
      [RouteType.URBAN]: { avgSpeed: 40, delayFactor: 1.3 },
      [RouteType.INTERSTATE]: { avgSpeed: 90, delayFactor: 1.1 },
      [RouteType.RURAL]: { avgSpeed: 60, delayFactor: 1.4 },
      [RouteType.EXPRESS]: { avgSpeed: 100, delayFactor: 1.0 },
      [RouteType.LOCAL]: { avgSpeed: 30, delayFactor: 1.2 },
    };

    return characteristics[type];
  }

  private mapToResponseDto(route: Route): RouteResponseDto {
    const dto = new RouteResponseDto();
    Object.assign(dto, route);
    return dto;
  }
}
