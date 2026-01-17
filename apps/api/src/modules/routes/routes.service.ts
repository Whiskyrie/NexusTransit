import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Route } from './entities/route.entity';
import { RouteStop } from './entities/route_stop.entity';
import { RouteHistory } from './entities/route_history.entity';
import { CreateRouteDto, CreateRouteStopDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { RouteFilterDto } from './dto/filter-route.dto';
import { RouteResponseDto, RouteStopResponseDto } from './dto/route-response.dto';
import { PaginatedResponseDto, DistanceCalculatorService } from '@nexus/common';
import { RouteValidatorService } from './validators/route.validator';
import { RouteStatus } from './enums/route-status';
import { RouteType } from './enums/route.type';
import { VehiclesService } from '../vehicles/vehicles.service';
import { VehicleStatus } from '../vehicles/enums/vehicle-status.enum';
import { DriversService } from '../drivers/drivers.service';
import { DriverStatus } from '../drivers/enums/driver-status.enum';
import { GoogleMapsService } from '@nexus/geo-services';
import { ROUTE_TYPE_CHARACTERISTICS } from './constants/route-calculation.constants';
import {
  ROUTE_PAGINATION_DEFAULTS,
  ROUTE_DATE_DEFAULTS,
  ROUTE_VALIDATION_DEFAULTS,
} from './constants/route-defaults.constants';

interface ChangedField {
  field_name: string;
  old_value: unknown;
  new_value: unknown;
}

interface ParsedCoordinates {
  latitude: number;
  longitude: number;
}

interface RouteTypeCharacteristics {
  avgSpeed: number;
  delayFactor: number;
}

/**
 * Interface para registro de entrega retornado pelo repositório genérico
 */
interface DeliveryRecord {
  id: string;
  customer_id: string;
}

/**
 * Interface para registro de endereço do cliente retornado pelo repositório genérico
 */
interface CustomerAddressRecord {
  id: string;
  customer_id: string;
  full_address: string;
  coordinates: string | null;
}

/**
 * Interface para resultado da query de sequência máxima
 */
interface MaxSequenceResult {
  max: number | null;
}

/**
 * Interface para métodos de verificação de estado da Route
 */
interface RouteWithStatusMethods {
  canBeEdited?: () => boolean;
  canBeStarted?: () => boolean;
  canBePaused?: () => boolean;
  canBeResumed?: () => boolean;
  canBeCompleted?: () => boolean;
  canBeCancelled?: () => boolean;
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
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly validatorService: RouteValidatorService,
    private readonly distanceCalculator: DistanceCalculatorService,
    @Inject(forwardRef(() => VehiclesService))
    private readonly vehiclesService: VehiclesService,
    @Inject(forwardRef(() => DriversService))
    private readonly driversService: DriversService,
    private readonly googleMapsService: GoogleMapsService,
  ) {}

  /**
   * Converte valor para Date de forma segura
   * Aceita string, number ou Date e retorna Date válido
   */
  private toSafeDate(value: unknown): Date {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return new Date(value);
    }
    return new Date();
  }

  /**
   * Verifica se a rota pode ser editada de forma segura
   */
  private canRouteBeEdited(route: Route): boolean {
    const routeWithMethods = route as RouteWithStatusMethods;
    if (typeof routeWithMethods.canBeEdited === 'function') {
      return routeWithMethods.canBeEdited();
    }
    // Fallback: verificar status diretamente
    return route.status === RouteStatus.PLANNED;
  }

  /**
   * Verifica se a rota pode ser iniciada de forma segura
   */
  private canRouteBeStarted(route: Route): boolean {
    const routeWithMethods = route as RouteWithStatusMethods;
    if (typeof routeWithMethods.canBeStarted === 'function') {
      return routeWithMethods.canBeStarted();
    }
    return route.status === RouteStatus.PLANNED;
  }

  /**
   * Verifica se a rota pode ser pausada de forma segura
   */
  private canRouteBePaused(route: Route): boolean {
    const routeWithMethods = route as RouteWithStatusMethods;
    if (typeof routeWithMethods.canBePaused === 'function') {
      return routeWithMethods.canBePaused();
    }
    return route.status === RouteStatus.IN_PROGRESS;
  }

  /**
   * Verifica se a rota pode ser retomada de forma segura
   */
  private canRouteBeResumed(route: Route): boolean {
    const routeWithMethods = route as RouteWithStatusMethods;
    if (typeof routeWithMethods.canBeResumed === 'function') {
      return routeWithMethods.canBeResumed();
    }
    return route.status === RouteStatus.PAUSED;
  }

  /**
   * Verifica se a rota pode ser finalizada de forma segura
   */
  private canRouteBeCompleted(route: Route): boolean {
    const routeWithMethods = route as RouteWithStatusMethods;
    if (typeof routeWithMethods.canBeCompleted === 'function') {
      return routeWithMethods.canBeCompleted();
    }
    return route.status === RouteStatus.IN_PROGRESS;
  }

  /**
   * Verifica se a rota pode ser cancelada de forma segura
   */
  private canRouteBeCancelled(route: Route): boolean {
    const routeWithMethods = route as RouteWithStatusMethods;
    if (typeof routeWithMethods.canBeCancelled === 'function') {
      return routeWithMethods.canBeCancelled();
    }
    return (
      route.status === RouteStatus.PLANNED ||
      route.status === RouteStatus.IN_PROGRESS ||
      route.status === RouteStatus.PAUSED
    );
  }

  /**
   * Wrapper para parseCoordinates com tipagem explícita
   * Resolve warnings de unsafe do ESLint em módulos externos
   */
  private parseCoords(point: string): ParsedCoordinates {
    const result = (
      this.distanceCalculator as unknown as {
        parseCoordinates: (point: string) => { latitude: number; longitude: number };
      }
    ).parseCoordinates(point);

    if (
      typeof result === 'object' &&
      result !== null &&
      'latitude' in result &&
      'longitude' in result
    ) {
      const parsed = result as { latitude: unknown; longitude: unknown };
      return {
        latitude: Number(parsed.latitude),
        longitude: Number(parsed.longitude),
      };
    }

    return { latitude: 0, longitude: 0 };
  }

  /**
   * Wrapper para calculateDistance com tipagem explícita
   */
  private calcDistance(origin: string, destination: string): number {
    const result = (
      this.distanceCalculator as unknown as {
        calculateDistance: (origin: string, destination: string) => number;
      }
    ).calculateDistance(origin, destination);
    return typeof result === 'number' ? result : 0;
  }

  /**
   * Calcula distância e duração reais usando Google Maps API
   */
  private async calculateRealDistanceAndDuration(
    originAddress: string,
    destinationAddress: string,
  ): Promise<{ distance_km: number; duration_minutes: number } | null> {
    try {
      const response = await this.googleMapsService.getDistanceMatrix(
        [originAddress],
        [destinationAddress],
        'driving',
      );

      if (
        response?.rows?.[0]?.elements?.[0]?.status === 'OK' &&
        response.rows[0].elements[0].distance &&
        response.rows[0].elements[0].duration
      ) {
        const distanceMeters = response.rows[0].elements[0].distance.value;
        const durationSeconds = response.rows[0].elements[0].duration.value;

        return {
          distance_km: distanceMeters / 1000,
          duration_minutes: durationSeconds / 60,
        };
      }

      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Erro ao calcular distância via Google Maps: ${errorMessage}`);
      return null;
    }
  }

  /**
   * Wrapper para calculateEstimatedDuration com tipagem explícita
   */
  private calcDuration(distanceKm: number, avgSpeed?: number, delayFactor?: number): number {
    const result = (
      this.distanceCalculator as unknown as {
        calculateEstimatedDuration: (
          distanceKm: number,
          avgSpeed?: number,
          delayFactor?: number,
        ) => number;
      }
    ).calculateEstimatedDuration(distanceKm, avgSpeed, delayFactor);
    return typeof result === 'number' ? result : 0;
  }

  async create(createDto: CreateRouteDto): Promise<RouteResponseDto> {
    this.logger.log(`Criando rota: ${createDto.route_code}`);

    await this.validatorService.validateUniqueRouteCode(createDto.route_code);
    await this.validatorService.validateDriverExists(createDto.driver_id);

    const plannedDateValue: Date = this.toSafeDate(createDto.planned_date);

    await this.validatorService.validateDriverAssignment(createDto.driver_id, plannedDateValue);

    await this.validatorService.validateVehicleExists(createDto.vehicle_id);
    await this.validatorService.validateVehicleAssignment(createDto.vehicle_id, plannedDateValue);

    // Validação de datas removida - planned_end_time foi substituído por estimated_end_date
    // que é calculado automaticamente usando Google Maps API

    if (createDto.total_load_kg || createDto.total_volume_m3) {
      await this.validatorService.validateRouteCapacity(
        createDto.vehicle_id,
        createDto.total_load_kg,
        createDto.total_volume_m3,
      );
    }

    let calculatedDistance: number | undefined;
    let calculatedDuration: number | undefined;

    // Tentar calcular distância real usando Google Maps API se endereços fornecidos
    if (createDto.origin_address && createDto.destination_address) {
      const realDistance = await this.calculateRealDistanceAndDuration(
        createDto.origin_address,
        createDto.destination_address,
      );

      if (realDistance) {
        calculatedDistance = realDistance.distance_km;
        calculatedDuration = realDistance.duration_minutes;
        this.logger.log('Usando distância real calculada via Google Maps API');
      }
    }

    // Fallback: calcular por coordenadas se não conseguiu via endereços
    if (!calculatedDistance && createDto.origin_coordinates && createDto.destination_coordinates) {
      calculatedDistance = this.calcDistance(
        createDto.origin_coordinates,
        createDto.destination_coordinates,
      );

      const characteristics = this.getRouteTypeCharacteristics(createDto.type);
      calculatedDuration = this.calcDuration(
        calculatedDistance,
        characteristics.avgSpeed,
        characteristics.delayFactor,
      );
      this.logger.log('Usando distância estimada via coordenadas (Haversine)');
    }

    const { stops, ...routeData } = createDto;

    const routeDateValue: Date = this.toSafeDate(createDto.route_date);

    // Criar objeto LIMPO - sem campos undefined
    const preparedData: Partial<Route> = {
      route_code: routeData.route_code,
      name: routeData.name,
      vehicle_id: routeData.vehicle_id,
      driver_id: routeData.driver_id,
      type: routeData.type,
      origin_address: routeData.origin_address,
      destination_address: routeData.destination_address,
      route_date: routeDateValue,
      planned_date: plannedDateValue,
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

    // Atualizar status do motorista para ON_ROUTE
    if (savedRoute.driver_id) {
      try {
        await this.driversService.update(savedRoute.driver_id, { status: DriverStatus.ON_ROUTE });
        this.logger.log(`Motorista ${savedRoute.driver_id} atualizado para ON_ROUTE`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Erro ao atualizar status do motorista: ${errorMessage}`);
      }
    }

    // Atualizar status do veículo para IN_ROUTE
    if (savedRoute.vehicle_id) {
      try {
        await this.vehiclesService.update(savedRoute.vehicle_id, {
          status: VehicleStatus.IN_ROUTE,
        });
        this.logger.log(`Veículo ${savedRoute.vehicle_id} atualizado para IN_ROUTE`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Erro ao atualizar status do veículo: ${errorMessage}`);
      }
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
    const {
      page = ROUTE_PAGINATION_DEFAULTS.DEFAULT_PAGE,
      limit = ROUTE_PAGINATION_DEFAULTS.DEFAULT_LIMIT,
      search,
      ...filters
    } = filterDto;

    // Usar QueryBuilder para busca mais flexível
    const queryBuilder = this.routeRepository
      .createQueryBuilder('route')
      .leftJoinAndSelect('route.vehicle', 'vehicle')
      .leftJoinAndSelect('route.driver', 'driver')
      .leftJoinAndSelect('route.stops', 'stops');

    // Busca por texto (nome da rota, código, nome do motorista, placa do veículo)
    if (search) {
      queryBuilder.andWhere(
        '(route.name ILIKE :search OR route.route_code ILIKE :search OR driver.full_name ILIKE :search OR vehicle.license_plate ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (filters.status) {
      queryBuilder.andWhere('route.status = :status', { status: filters.status });
    }

    if (filters.type) {
      queryBuilder.andWhere('route.type = :type', { type: filters.type });
    }

    if (filters.vehicle_id) {
      queryBuilder.andWhere('route.vehicle_id = :vehicle_id', { vehicle_id: filters.vehicle_id });
    }

    if (filters.driver_id) {
      queryBuilder.andWhere('route.driver_id = :driver_id', { driver_id: filters.driver_id });
    }

    if (filters.route_date_from || filters.route_date_to) {
      const startDateInput: unknown = filters.route_date_from;
      const endDateInput: unknown = filters.route_date_to;

      const startDate: Date =
        typeof startDateInput === 'string' || typeof startDateInput === 'number'
          ? new Date(startDateInput)
          : new Date(ROUTE_DATE_DEFAULTS.MIN_DATE);

      const endDate: Date =
        typeof endDateInput === 'string' || typeof endDateInput === 'number'
          ? new Date(endDateInput)
          : new Date(ROUTE_DATE_DEFAULTS.MAX_DATE);

      queryBuilder.andWhere('route.planned_date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    // Ordenação e paginação
    queryBuilder
      .orderBy('route.planned_date', 'DESC')
      .addOrderBy('route.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [routes, total] = await queryBuilder.getManyAndCount();

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

    if (
      !this.canRouteBeEdited(route) &&
      Object.keys(updateDto).length > ROUTE_VALIDATION_DEFAULTS.MAX_CHANGES_PER_UPDATE
    ) {
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

    // Validação de datas removida - planned_end_time foi substituído por estimated_end_date
    // que é calculado automaticamente usando Google Maps API

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
    if (updateDto.route_date) {
      route.route_date = this.toSafeDate(updateDto.route_date);
    }
    if (updateDto.planned_date) {
      route.planned_date = this.toSafeDate(updateDto.planned_date);
    }
    if (updateDto.planned_start_time !== undefined) {
      route.planned_start_time = updateDto.planned_start_time;
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

    // Recalcular distância e duração se endereços mudaram
    const addressesChanged =
      (updateDto.origin_address && updateDto.origin_address !== route.origin_address) ??
      (updateDto.destination_address &&
        updateDto.destination_address !== route.destination_address);

    if (addressesChanged && route.origin_address && route.destination_address) {
      this.logger.log('Endereços alterados - recalculando distância via Google Maps API');

      const realDistance = await this.calculateRealDistanceAndDuration(
        route.origin_address,
        route.destination_address,
      );

      if (realDistance) {
        // Só atualizar se não foram fornecidos valores manuais
        if (updateDto.estimated_distance_km === undefined) {
          route.estimated_distance_km = realDistance.distance_km;
          this.logger.log(`Distância atualizada automaticamente: ${realDistance.distance_km} km`);
        }
        if (updateDto.estimated_duration_minutes === undefined) {
          route.estimated_duration_minutes = realDistance.duration_minutes;
          this.logger.log(
            `Duração atualizada automaticamente: ${realDistance.duration_minutes} min`,
          );
        }
      }
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

    if (!this.canRouteBeStarted(route)) {
      throw new BadRequestException(`Rota não pode ser iniciada no status ${route.status}`);
    }

    route.status = RouteStatus.IN_PROGRESS;
    route.actual_start_time = new Date();

    await this.routeRepository.save(route);

    // Nota: Status do motorista e veículo já foram atualizados na criação da rota

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

    if (!this.canRouteBePaused(route)) {
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

    if (!this.canRouteBeResumed(route)) {
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

    if (!this.canRouteBeCompleted(route)) {
      throw new BadRequestException(`Rota não pode ser finalizada no status ${route.status}`);
    }

    route.status = RouteStatus.COMPLETED;
    route.actual_end_time = new Date();

    if (route.actual_start_time) {
      const durationMs = route.actual_end_time.getTime() - route.actual_start_time.getTime();
      route.actual_duration_minutes = Math.floor(durationMs / (1000 * 60));
    }

    await this.routeRepository.save(route);

    // Restaurar status do motorista para ACTIVE
    if (route.driver_id) {
      try {
        await this.driversService.update(route.driver_id, { status: DriverStatus.ACTIVE });
        this.logger.log(`Motorista ${route.driver_id} restaurado para ACTIVE`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Erro ao atualizar status do motorista: ${errorMessage}`);
      }
    }

    // Restaurar status do veículo para ACTIVE
    if (route.vehicle_id) {
      try {
        await this.vehiclesService.update(route.vehicle_id, { status: VehicleStatus.ACTIVE });
        this.logger.log(`Veículo ${route.vehicle_id} restaurado para ACTIVE`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Erro ao atualizar status do veículo: ${errorMessage}`);
      }
    }

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

    if (!this.canRouteBeCancelled(route)) {
      throw new BadRequestException(`Rota não pode ser cancelada no status ${route.status}`);
    }

    const previousStatus = route.status;
    route.status = RouteStatus.CANCELLED;
    route.cancellation_reason = reason;
    route.cancelled_at = new Date();

    await this.routeRepository.save(route);

    // Restaurar status do motorista para ACTIVE
    if (route.driver_id) {
      try {
        await this.driversService.update(route.driver_id, { status: DriverStatus.ACTIVE });
        this.logger.log(`Motorista ${route.driver_id} restaurado para ACTIVE`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Erro ao atualizar status do motorista: ${errorMessage}`);
      }
    }

    // Restaurar status do veículo para ACTIVE
    if (route.vehicle_id) {
      try {
        await this.vehiclesService.update(route.vehicle_id, { status: VehicleStatus.ACTIVE });
        this.logger.log(`Veículo ${route.vehicle_id} restaurado para ACTIVE`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Erro ao atualizar status do veículo: ${errorMessage}`);
      }
    }

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

  /**
   * Obtém valor de uma propriedade do Route de forma segura
   */
  private getRoutePropertyValue(route: Route, key: string): unknown {
    const routeRecord = route as unknown as Record<string, unknown>;
    return routeRecord[key];
  }

  /**
   * Obtém valor de uma propriedade do UpdateRouteDto de forma segura
   */
  private getUpdateDtoPropertyValue(dto: UpdateRouteDto, key: string): unknown {
    const dtoRecord = dto as unknown as Record<string, unknown>;
    return dtoRecord[key];
  }

  private getChangedFields(original: Route, updated: UpdateRouteDto): ChangedField[] {
    const changed: ChangedField[] = [];
    const keys = Object.keys(updated);

    for (const key of keys) {
      const oldValue: unknown = this.getRoutePropertyValue(original, key);
      const newValue: unknown = this.getUpdateDtoPropertyValue(updated, key);

      if (oldValue !== newValue && newValue !== undefined) {
        changed.push({
          field_name: key,
          old_value: oldValue,
          new_value: newValue,
        });
      }
    }

    return changed;
  }

  private getRouteTypeCharacteristics(type: RouteType): RouteTypeCharacteristics {
    const characteristics: unknown = ROUTE_TYPE_CHARACTERISTICS[type];

    if (
      typeof characteristics === 'object' &&
      characteristics !== null &&
      'avgSpeed' in characteristics &&
      'delayFactor' in characteristics
    ) {
      const parsed = characteristics as { avgSpeed: unknown; delayFactor: unknown };
      const avgSpeed = typeof parsed.avgSpeed === 'number' ? parsed.avgSpeed : 60;
      const delayFactor = typeof parsed.delayFactor === 'number' ? parsed.delayFactor : 1.2;

      return { avgSpeed, delayFactor };
    }

    this.logger.warn(
      `Características não encontradas para tipo de rota: ${type}. Usando valores padrão.`,
    );

    return {
      avgSpeed: 60,
      delayFactor: 1.2,
    };
  }

  /**
   * Mapeia a entidade Route para RouteResponseDto
   *
   * Usa plainToInstance do class-transformer para:
   * - Aplicar transformações automaticamente (@Transform)
   * - Excluir campos marcados com @Exclude
   * - Incluir apenas campos marcados com @Expose
   * - Converter nested objects (@Type)
   */
  private mapToResponseDto(route: Route): RouteResponseDto {
    const result: unknown = plainToInstance(RouteResponseDto, route, {
      excludeExtraneousValues: true,
    });

    return result as RouteResponseDto;
  }

  /**
   * Mapeia a entidade RouteStop para RouteStopResponseDto
   *
   * Usa plainToInstance para mapeamento seguro
   * Método auxiliar disponível para uso futuro em endpoints específicos de paradas
   */
  private mapStopToResponseDto(stop: RouteStop): RouteStopResponseDto {
    const result: unknown = plainToInstance(RouteStopResponseDto, stop, {
      excludeExtraneousValues: true,
    });

    return result as RouteStopResponseDto;
  }

  /**
   * Obtém dados da rota formatados para visualização em mapa
   *
   * Retorna estrutura com coordenadas, marcadores de paradas e polyline da rota
   *
   * @param id - ID da rota
   * @returns Dados formatados para mapa incluindo marcadores, polyline e metadados
   * @throws NotFoundException - Se rota não existir
   */
  async getRouteMapData(id: string): Promise<{
    route_id: string;
    route_code: string;
    status: RouteStatus;
    route_date: Date;
    start_location: ParsedCoordinates | null;
    end_location: ParsedCoordinates | null;
    stops: {
      id: string;
      sequence: number;
      latitude: number | null;
      longitude: number | null;
      status: string;
      address: string;
      customer_address_id: string | undefined;
      planned_arrival_time: string | null;
      actual_arrival_time: Date | null;
    }[];
    polyline: ParsedCoordinates[];
    total_distance_km: number | undefined;
    total_duration_minutes: number | undefined;
    optimization_score: number | undefined;
  }> {
    const route = await this.routeRepository.findOne({
      where: { id },
      relations: ['stops', 'stops.customer_address'],
    });

    if (!route) {
      throw new NotFoundException(`Rota com ID ${id} não encontrada`);
    }

    // Ordenar paradas por sequência
    const routeStops: RouteStop[] = route.stops ?? [];
    const orderedStops: RouteStop[] = [...routeStops].sort(
      (a, b) => a.sequence_order - b.sequence_order,
    );

    // Montar array de coordenadas para polyline (linha conectando todas as paradas)
    const polyline: ParsedCoordinates[] = [];

    // Adicionar start_location à polyline se existir
    if (route.start_location) {
      const startCoords: ParsedCoordinates = this.parseCoords(route.start_location);
      polyline.push(startCoords);
    }

    // Adicionar coordenadas de cada parada
    for (const stop of orderedStops) {
      if (stop.coordinates) {
        const coords: ParsedCoordinates = this.parseCoords(stop.coordinates);
        polyline.push(coords);
      }
    }

    // Adicionar end_location à polyline se existir
    if (route.end_location) {
      const endCoords: ParsedCoordinates = this.parseCoords(route.end_location);
      polyline.push(endCoords);
    }

    // Montar marcadores de paradas
    const stops = orderedStops.map(stop => {
      const coords: ParsedCoordinates = stop.coordinates
        ? this.parseCoords(stop.coordinates)
        : { latitude: 0, longitude: 0 };

      return {
        id: stop.id,
        sequence: stop.sequence_order,
        latitude: stop.coordinates ? coords.latitude : null,
        longitude: stop.coordinates ? coords.longitude : null,
        status: stop.status,
        address: stop.address,
        customer_address_id: stop.customer_address_id,
        planned_arrival_time: stop.planned_arrival_time ?? null,
        actual_arrival_time: stop.actual_arrival_time ?? null,
      };
    });

    const startLocation: ParsedCoordinates | null = route.start_location
      ? this.parseCoords(route.start_location)
      : null;

    const endLocation: ParsedCoordinates | null = route.end_location
      ? this.parseCoords(route.end_location)
      : null;

    return {
      route_id: route.id,
      route_code: route.route_code,
      status: route.status,
      route_date: route.route_date,
      start_location: startLocation,
      end_location: endLocation,
      stops,
      polyline,
      total_distance_km: route.total_distance,
      total_duration_minutes: route.total_duration,
      optimization_score: route.optimization_score,
    };
  }

  /**
   * Lista entregas de uma rota em ordem de sequência
   *
   * @param routeId - ID da rota
   * @returns Lista de paradas com informações das entregas
   */
  async getRouteDeliveries(routeId: string): Promise<RouteStop[]> {
    await this.findRouteOrFail(routeId);

    const stops = await this.routeStopRepository.find({
      where: { route_id: routeId },
      order: { sequence_order: 'ASC' },
      relations: ['customer_address', 'customer_address.customer'],
    });

    return stops;
  }

  /**
   * Adiciona uma entrega à rota
   *
   * @param routeId - ID da rota
   * @param deliveryId - ID da entrega
   * @param sequenceOrder - Posição na sequência (opcional)
   * @param notes - Observações (opcional)
   * @returns Parada criada
   */
  async addDeliveryToRoute(
    routeId: string,
    deliveryId: string,
    sequenceOrder?: number,
    notes?: string,
  ): Promise<RouteStop> {
    const route = await this.findRouteOrFail(routeId);

    // Validar se rota pode ser editada
    if (!this.canRouteBeEdited(route)) {
      throw new BadRequestException(
        `Rota com status ${route.status} não pode ter entregas adicionadas`,
      );
    }

    // Verificar se entrega existe e está disponível
    const deliveryRepository = this.entityManager.getRepository('deliveries');
    const deliveryResult: unknown = await deliveryRepository.findOne({
      where: { id: deliveryId },
    });

    if (!deliveryResult) {
      throw new NotFoundException(`Entrega com ID ${deliveryId} não encontrada`);
    }

    // Validar e fazer type assertion segura para delivery
    const delivery = this.validateDeliveryRecord(deliveryResult);

    // Verificar se entrega já está em outra rota ativa
    const existingStop = await this.routeStopRepository
      .createQueryBuilder('stop')
      .innerJoin('stop.route', 'route')
      .where('stop.delivery_id = :deliveryId', { deliveryId })
      .andWhere('route.status IN (:...statuses)', {
        statuses: [RouteStatus.PLANNED, RouteStatus.IN_PROGRESS],
      })
      .getOne();

    if (existingStop) {
      throw new BadRequestException('Entrega já está vinculada a outra rota ativa');
    }

    // Buscar endereço do cliente da entrega
    const customerAddressRepository = this.entityManager.getRepository('customer_addresses');
    const customerAddressResult: unknown = await customerAddressRepository.findOne({
      where: { customer_id: delivery.customer_id },
    });

    if (!customerAddressResult) {
      throw new NotFoundException('Endereço do cliente não encontrado');
    }

    // Validar e fazer type assertion segura para customerAddress
    const customerAddress = this.validateCustomerAddressRecord(customerAddressResult);

    // Determinar sequência
    let finalSequence = sequenceOrder;
    if (!finalSequence) {
      const maxSequenceResult: unknown = await this.routeStopRepository
        .createQueryBuilder('stop')
        .select('MAX(stop.sequence_order)', 'max')
        .where('stop.route_id = :routeId', { routeId })
        .getRawOne();

      const maxSequence = this.validateMaxSequenceResult(maxSequenceResult);
      finalSequence = (maxSequence.max ?? 0) + 1;
    } else {
      // Reordenar paradas existentes se necessário
      await this.routeStopRepository
        .createQueryBuilder()
        .update(RouteStop)
        .set({ sequence_order: () => 'sequence_order + 1' })
        .where('route_id = :routeId', { routeId })
        .andWhere('sequence_order >= :sequence', { sequence: finalSequence })
        .execute();
    }

    // Criar parada
    const stop = this.routeStopRepository.create({
      route_id: routeId,
      customer_address_id: customerAddress.id,
      delivery_id: deliveryId,
      sequence_order: finalSequence,
      address: customerAddress.full_address,
      coordinates: customerAddress.coordinates ?? undefined,
      status: 'PENDING',
      notes,
    });

    const savedStop = await this.routeStopRepository.save(stop);

    // Atualizar métricas da rota
    await this.updateRouteMetricsAfterChange(routeId);

    // Registrar histórico
    await this.createHistoryEntry(routeId, {
      event_type: 'DELIVERY_ADDED',
      description: `Entrega ${deliveryId} adicionada na posição ${finalSequence}`,
      new_status: route.status,
    });

    this.logger.log(`Entrega ${deliveryId} adicionada à rota ${routeId}`);

    return savedStop;
  }

  /**
   * Valida e converte resultado do repositório para DeliveryRecord
   */
  private validateDeliveryRecord(result: unknown): DeliveryRecord {
    if (
      typeof result === 'object' &&
      result !== null &&
      'id' in result &&
      'customer_id' in result
    ) {
      const record = result as Record<string, unknown>;
      return {
        id: String(record.id),
        customer_id: String(record.customer_id),
      };
    }
    throw new BadRequestException('Formato de entrega inválido');
  }

  /**
   * Valida e converte resultado do repositório para CustomerAddressRecord
   */
  private validateCustomerAddressRecord(result: unknown): CustomerAddressRecord {
    if (
      typeof result === 'object' &&
      result !== null &&
      'id' in result &&
      'customer_id' in result &&
      'full_address' in result
    ) {
      const record = result as Record<string, unknown>;

      // Tratar coordinates de forma segura - pode ser string, objeto ou null
      let coordinatesValue: string | null = null;
      if (record.coordinates !== null && record.coordinates !== undefined) {
        if (typeof record.coordinates === 'string') {
          coordinatesValue = record.coordinates;
        } else if (typeof record.coordinates === 'object') {
          // Se for objeto, converter para JSON string
          coordinatesValue = JSON.stringify(record.coordinates);
        }
      }

      return {
        id: String(record.id),
        customer_id: String(record.customer_id),
        full_address: String(record.full_address),
        coordinates: coordinatesValue,
      };
    }
    throw new BadRequestException('Formato de endereço do cliente inválido');
  }

  /**
   * Valida e converte resultado da query de sequência máxima
   */
  private validateMaxSequenceResult(result: unknown): MaxSequenceResult {
    if (typeof result === 'object' && result !== null && 'max' in result) {
      const record = result as Record<string, unknown>;
      const maxValue = record.max;
      return {
        max: typeof maxValue === 'number' ? maxValue : null,
      };
    }
    return { max: null };
  }

  /**
   * Remove uma entrega da rota
   *
   * @param routeId - ID da rota
   * @param deliveryId - ID da entrega
   */
  async removeDeliveryFromRoute(routeId: string, deliveryId: string): Promise<void> {
    const route = await this.findRouteOrFail(routeId);

    // Validar se rota pode ser editada
    if (!this.canRouteBeEdited(route)) {
      throw new BadRequestException(
        `Rota com status ${route.status} não pode ter entregas removidas`,
      );
    }

    // Buscar parada
    const stop = await this.routeStopRepository.findOne({
      where: { route_id: routeId, delivery_id: deliveryId },
    });

    if (!stop) {
      throw new NotFoundException(`Entrega ${deliveryId} não encontrada na rota`);
    }

    const removedSequence = stop.sequence_order;

    // Remover parada
    await this.routeStopRepository.softRemove(stop);

    // Reordenar paradas restantes
    await this.routeStopRepository
      .createQueryBuilder()
      .update(RouteStop)
      .set({ sequence_order: () => 'sequence_order - 1' })
      .where('route_id = :routeId', { routeId })
      .andWhere('sequence_order > :sequence', { sequence: removedSequence })
      .execute();

    // Atualizar métricas da rota
    await this.updateRouteMetricsAfterChange(routeId);

    // Registrar histórico
    await this.createHistoryEntry(routeId, {
      event_type: 'DELIVERY_REMOVED',
      description: `Entrega ${deliveryId} removida da posição ${removedSequence}`,
      new_status: route.status,
    });

    this.logger.log(`Entrega ${deliveryId} removida da rota ${routeId}`);
  }

  /**
   * Reordena entregas na rota
   *
   * @param routeId - ID da rota
   * @param reorderData - Dados de reordenação
   */
  async reorderDeliveries(
    routeId: string,
    reorderData: { stop_id: string; new_sequence: number }[],
  ): Promise<RouteStop[]> {
    const route = await this.findRouteOrFail(routeId);

    // Validar se rota pode ser editada
    if (!this.canRouteBeEdited(route)) {
      throw new BadRequestException(
        `Rota com status ${route.status} não pode ter entregas reordenadas`,
      );
    }

    // Buscar todas as paradas da rota
    const stops = await this.routeStopRepository.find({
      where: { route_id: routeId },
    });

    // Validar se todos os IDs existem
    const stopIds = stops.map(s => s.id);
    const requestedIds = reorderData.map(r => r.stop_id);

    for (const id of requestedIds) {
      if (!stopIds.includes(id)) {
        throw new NotFoundException(`Parada com ID ${id} não encontrada na rota`);
      }
    }

    // Validar se não há sequências duplicadas
    const sequences = reorderData.map(r => r.new_sequence);
    const uniqueSequences = new Set(sequences);
    if (sequences.length !== uniqueSequences.size) {
      throw new BadRequestException('Sequências duplicadas não são permitidas');
    }

    // Aplicar nova ordenação
    for (const item of reorderData) {
      await this.routeStopRepository.update(
        { id: item.stop_id },
        { sequence_order: item.new_sequence },
      );
    }

    // Atualizar métricas da rota (recalcular distâncias)
    await this.updateRouteMetricsAfterChange(routeId);

    // Registrar histórico
    await this.createHistoryEntry(routeId, {
      event_type: 'DELIVERIES_REORDERED',
      description: `${reorderData.length} paradas foram reordenadas`,
      new_status: route.status,
    });

    this.logger.log(`Entregas da rota ${routeId} reordenadas`);

    // Retornar paradas atualizadas
    return this.routeStopRepository.find({
      where: { route_id: routeId },
      order: { sequence_order: 'ASC' },
      relations: ['customer_address'],
    });
  }

  /**
   * Atualiza métricas da rota após mudanças nas paradas
   *
   * @param routeId - ID da rota
   */
  private async updateRouteMetricsAfterChange(routeId: string): Promise<void> {
    const stops = await this.routeStopRepository.find({
      where: { route_id: routeId },
      order: { sequence_order: 'ASC' },
    });

    // Recalcular distâncias entre paradas
    let totalDistance = 0;

    for (let i = 0; i < stops.length - 1; i++) {
      const current = stops[i];
      const next = stops[i + 1];

      if (current?.coordinates && next?.coordinates) {
        const distance = this.calcDistance(current.coordinates, next.coordinates);

        // Atualizar distância da próxima parada
        await this.routeStopRepository.update(
          { id: next.id },
          { distance_from_previous_km: distance },
        );

        totalDistance += distance;
      }
    }

    // Atualizar totais da rota
    await this.routeRepository.update(
      { id: routeId },
      {
        total_deliveries: stops.length,
        total_distance: totalDistance,
      },
    );
  }
}
