import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Driver } from './entities/driver.entity';
import { DriverAvailability } from './entities/driver-availability.entity';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { DriverFilterDto } from './dto/driver-filter.dto';
import { DriverResponseDto } from './dto/driver-response.dto';
import { PaginatedResponseDto, normalizeCPF } from '@nexus/common';
import { DriverStatus } from './enums/driver-status.enum';
import { CNHCategory } from './enums/cnh-category.enum';
import { AvailabilityType } from './enums/availability-type.enum';
import { DriverLicenseService } from './services/driver-license.service';
import { convertDateFormat, validateMinimumAge } from './utils/date.util';
import { MINIMUM_DRIVER_AGE } from './constants/driver.constants';
import { DriverLicenseUpdateData } from './interfaces/driver-license.interface';

@Injectable()
export class DriversService {
  private readonly logger = new Logger(DriversService.name);

  constructor(
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(DriverAvailability)
    private readonly availabilityRepository: Repository<DriverAvailability>,
    private readonly driverLicenseService: DriverLicenseService,
  ) {}

  async create(createDriverDto: CreateDriverDto): Promise<DriverResponseDto> {
    // Validate CPF
    const normalizedCPF = normalizeCPF(createDriverDto.cpf);

    // Check if driver with this CPF already exists
    const existingDriver = await this.driverRepository.findOne({
      where: { cpf: normalizedCPF },
    });

    if (existingDriver) {
      throw new BadRequestException(`Motorista com CPF ${normalizedCPF} já existe`);
    }

    // Check if email already exists
    const existingEmail = await this.driverRepository.findOne({
      where: { email: createDriverDto.email },
    });

    if (existingEmail) {
      throw new BadRequestException(`Email ${createDriverDto.email} já está em uso`);
    }

    // Validate age (minimum 18 years)
    const formattedBirthDate = convertDateFormat(createDriverDto.birth_date);
    const birthDate = new Date(formattedBirthDate);

    if (!validateMinimumAge(birthDate, MINIMUM_DRIVER_AGE)) {
      throw new BadRequestException(`Motorista deve ter no mínimo ${MINIMUM_DRIVER_AGE} anos`);
    }

    // Create driver
    const driver = this.driverRepository.create({
      cpf: normalizedCPF,
      full_name: createDriverDto.full_name,
      birth_date: birthDate,
      email: createDriverDto.email,
      phone: createDriverDto.phone,
      status: createDriverDto.status ?? DriverStatus.AVAILABLE,
      is_active: createDriverDto.is_active ?? true,
    });

    const savedDriver = await this.driverRepository.save(driver);

    // Create driver license using DriverLicenseService
    await this.driverLicenseService.createDriverLicense(
      savedDriver,
      createDriverDto.cnh_number,
      createDriverDto.cnh_category,
      createDriverDto.cnh_expiration_date,
    );

    this.logger.log(`Motorista criado: ${savedDriver.full_name} (${savedDriver.id})`);

    return this.mapToResponseDto(savedDriver);
  }

  async findAll(filter: DriverFilterDto): Promise<PaginatedResponseDto<DriverResponseDto>> {
    const { page = 1, limit = 10, ...filters } = filter;
    const skip = (page - 1) * limit;

    const queryBuilder = this.driverRepository
      .createQueryBuilder('driver')
      .leftJoinAndSelect('driver.license', 'license')
      .leftJoinAndSelect('driver.documents', 'documents')
      .where('driver.is_active = :isActive', { isActive: true });

    // Apply filters
    if (filters.status) {
      queryBuilder.andWhere('driver.status = :status', { status: filters.status });
    }

    if (filters.name) {
      queryBuilder.andWhere('driver.full_name ILIKE :name', {
        name: `%${filters.name}%`,
      });
    }

    if (filters.cpf) {
      queryBuilder.andWhere('driver.cpf = :cpf', { cpf: filters.cpf });
    }

    if (filters.email) {
      queryBuilder.andWhere('driver.email = :email', { email: filters.email });
    }

    if (filters.is_active !== undefined) {
      queryBuilder.andWhere('driver.is_active = :isActive', {
        isActive: filters.is_active,
      });
    }

    const [drivers, total] = await queryBuilder
      .orderBy('driver.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const driverDtos = drivers.map(driver => this.mapToResponseDto(driver));

    return PaginatedResponseDto.create(driverDtos, page, limit, total);
  }

  async findOne(id: string): Promise<DriverResponseDto> {
    const driver = await this.driverRepository.findOne({
      where: { id },
      relations: ['license', 'documents'],
    });

    if (!driver) {
      throw new NotFoundException(`Motorista com ID ${id} não encontrado`);
    }

    return this.mapToResponseDto(driver);
  }

  async update(id: string, updateDriverDto: UpdateDriverDto): Promise<DriverResponseDto> {
    const driver = await this.driverRepository.findOne({
      where: { id },
      relations: ['license'],
    });

    if (!driver) {
      throw new NotFoundException(`Motorista com ID ${id} não encontrado`);
    }

    // Check for duplicate CPF if being updated
    if (updateDriverDto.cpf && updateDriverDto.cpf !== driver.cpf) {
      const normalizedCPF = normalizeCPF(updateDriverDto.cpf);
      const existingDriver = await this.driverRepository.findOne({
        where: { cpf: normalizedCPF },
      });

      if (existingDriver) {
        throw new BadRequestException(`Motorista com CPF ${normalizedCPF} já existe`);
      }
    }

    // Check for duplicate email if being updated
    if (updateDriverDto.email && updateDriverDto.email !== driver.email) {
      const existingEmail = await this.driverRepository.findOne({
        where: { email: updateDriverDto.email },
      });

      if (existingEmail) {
        throw new BadRequestException(`Email ${updateDriverDto.email} já está em uso`);
      }
    }

    // Update driver fields
    if (updateDriverDto.cpf) {
      driver.cpf = normalizeCPF(updateDriverDto.cpf);
    }
    if (updateDriverDto.full_name) {
      driver.full_name = updateDriverDto.full_name;
    }
    if (updateDriverDto.birth_date) {
      driver.birth_date = new Date(updateDriverDto.birth_date);
    }
    if (updateDriverDto.email) {
      driver.email = updateDriverDto.email;
    }
    if (updateDriverDto.phone) {
      driver.phone = updateDriverDto.phone;
    }
    if (updateDriverDto.status) {
      driver.status = updateDriverDto.status;
    }
    if (updateDriverDto.is_active !== undefined) {
      driver.is_active = updateDriverDto.is_active;
    }

    const updatedDriver = await this.driverRepository.save(driver);

    // Update license if provided
    if (
      updateDriverDto.cnh_number ||
      updateDriverDto.cnh_category ||
      updateDriverDto.cnh_expiration_date
    ) {
      if (driver.license) {
        const updateData: DriverLicenseUpdateData = {};

        if (updateDriverDto.cnh_number) {
          updateData.license_number = updateDriverDto.cnh_number;
        }
        if (updateDriverDto.cnh_category) {
          updateData.category = updateDriverDto.cnh_category;
        }
        if (updateDriverDto.cnh_expiration_date) {
          updateData.expiration_date = updateDriverDto.cnh_expiration_date;
        }

        await this.driverLicenseService.updateDriverLicense(driver.license.id, updateData);
      }
    }

    this.logger.log(`Motorista atualizado: ${updatedDriver.id}`);

    return this.mapToResponseDto(updatedDriver);
  }

  async remove(id: string): Promise<void> {
    const driver = await this.driverRepository.findOne({
      where: { id },
    });

    if (!driver) {
      throw new NotFoundException(`Motorista com ID ${id} não encontrado`);
    }

    // Soft delete - mark as inactive
    driver.is_active = false;
    await this.driverRepository.save(driver);

    this.logger.log(`Motorista removido (soft delete): ${driver.id}`);
  }

  // ===================================
  // Métodos Adicionais
  // ===================================

  /**
   * Busca motoristas disponíveis em uma data específica
   *
   * @param date - Data para verificar disponibilidade (opcional, padrão: hoje)
   * @param filters - Filtros adicionais (MOPP, status, etc)
   * @returns Lista de motoristas disponíveis
   */
  async findAvailableDrivers(
    date?: Date | string,
    filters?: {
      has_mopp?: boolean;
      status?: DriverStatus;
      cnh_category?: CNHCategory;
    },
  ): Promise<DriverResponseDto[]> {
    const targetDate = date ? new Date(date) : new Date();

    // 1. Buscar todos os motoristas ativos
    const queryBuilder = this.driverRepository
      .createQueryBuilder('driver')
      .leftJoinAndSelect('driver.license', 'license')
      .leftJoinAndSelect('driver.documents', 'documents')
      .where('driver.is_active = :isActive', { isActive: true });

    // Filtro de status
    if (filters?.status) {
      queryBuilder.andWhere('driver.status = :status', {
        status: filters.status,
      });
    } else {
      queryBuilder.andWhere('driver.status = :status', {
        status: 'ACTIVE' as DriverStatus,
      });
    }

    // Filtro de MOPP
    if (filters?.has_mopp) {
      queryBuilder.andWhere('driver.has_mopp = :hasMopp', { hasMopp: true });
      queryBuilder.andWhere(
        '(driver.mopp_expiry_date IS NULL OR driver.mopp_expiry_date >= :today)',
        { today: targetDate },
      );
    }

    // Filtro de categoria de CNH
    if (filters?.cnh_category) {
      queryBuilder.andWhere('license.category = :category', {
        category: filters.cnh_category,
      });
    }

    const drivers = await queryBuilder.getMany();

    // 2. Buscar indisponibilidades ativas para a data
    const unavailableDriverIds = await this.getUnavailableDriverIds(targetDate);

    // 3. Filtrar motoristas disponíveis
    const availableDrivers = drivers.filter(driver => !unavailableDriverIds.includes(driver.id));

    this.logger.debug(
      `Encontrados ${availableDrivers.length} motoristas disponíveis para ${targetDate.toLocaleDateString('pt-BR')}`,
    );

    return availableDrivers.map(driver => this.mapToResponseDto(driver));
  }

  /**
   * Verifica se um motorista específico está disponível em uma data
   *
   * @param driverId - ID do motorista
   * @param date - Data para verificar (opcional, padrão: hoje)
   * @returns true se disponível, false caso contrário
   */
  async checkAvailability(driverId: string, date?: Date | string): Promise<boolean> {
    const targetDate = date ? new Date(date) : new Date();

    // 1. Verificar se o motorista existe e está ativo
    const driver = await this.driverRepository.findOne({
      where: { id: driverId },
    });

    if (!driver?.is_active) {
      return false;
    }

    // 2. Verificar se está em status disponível
    if (driver.status !== DriverStatus.ACTIVE && driver.status !== DriverStatus.AVAILABLE) {
      return false;
    }

    // 3. Verificar indisponibilidades
    const unavailability = await this.availabilityRepository.findOne({
      where: {
        driver_id: driverId,
        is_active: true,
        start_date: LessThanOrEqual(targetDate),
        end_date: MoreThanOrEqual(targetDate),
        availability_type: Not(AvailabilityType.AVAILABLE),
      },
    });

    return !unavailability;
  }

  /**
   * Obtém estatísticas de um motorista
   *
   * @param driverId - ID do motorista
   * @returns Estatísticas do motorista
   */
  async getDriverStats(driverId: string): Promise<{
    driver: DriverResponseDto;
    stats: {
      total_trips: number;
      total_distance: number;
      rating_average: number | null;
      current_vehicle?: string;
      active_unavailabilities: number;
      pending_documents: number;
      expired_documents: number;
    };
  }> {
    const driver = await this.driverRepository.findOne({
      where: { id: driverId },
      relations: ['license', 'documents', 'current_vehicle', 'availabilities'],
    });

    if (!driver) {
      throw new NotFoundException(`Motorista com ID ${driverId} não encontrado`);
    }

    // Contar indisponibilidades ativas
    const activeUnavailabilities = await this.availabilityRepository.count({
      where: {
        driver_id: driverId,
        is_active: true,
        end_date: MoreThanOrEqual(new Date()),
        availability_type: Not(AvailabilityType.AVAILABLE),
      },
    });

    // Contar documentos pendentes (inativos)
    const pendingDocuments = driver.documents?.filter(doc => !doc.is_active).length ?? 0;

    // Contar documentos expirados
    const now = new Date();
    const expiredDocuments =
      driver.documents?.filter(doc => doc.expiration_date && new Date(doc.expiration_date) < now)
        .length ?? 0;

    return {
      driver: this.mapToResponseDto(driver),
      stats: {
        total_trips: driver.total_trips,
        total_distance: parseFloat(driver.total_distance.toString()),
        rating_average: driver.rating_average ? parseFloat(driver.rating_average.toString()) : null,
        current_vehicle: driver.current_vehicle_id ?? undefined,
        active_unavailabilities: activeUnavailabilities,
        pending_documents: pendingDocuments,
        expired_documents: expiredDocuments,
      },
    };
  }

  /**
   * Atribui um veículo a um motorista
   *
   * @param driverId - ID do motorista
   * @param vehicleId - ID do veículo
   * @returns Motorista atualizado
   */
  async assignVehicle(driverId: string, vehicleId: string): Promise<DriverResponseDto> {
    const driver = await this.driverRepository.findOne({
      where: { id: driverId },
    });

    if (!driver) {
      throw new NotFoundException(`Motorista com ID ${driverId} não encontrado`);
    }

    // TODO: Verificar se o veículo existe e está disponível
    // const vehicle = await this.vehicleRepository.findOne({ where: { id: vehicleId } });
    // if (!vehicle) {
    //   throw new NotFoundException(`Veículo com ID ${vehicleId} não encontrado`);
    // }

    driver.current_vehicle_id = vehicleId;
    const updated = await this.driverRepository.save(driver);

    this.logger.log(`Veículo ${vehicleId} atribuído ao motorista ${driverId}`);

    return this.mapToResponseDto(updated);
  }

  /**
   * Remove atribuição de veículo de um motorista
   *
   * @param driverId - ID do motorista
   * @returns Motorista atualizado
   */
  async unassignVehicle(driverId: string): Promise<DriverResponseDto> {
    const driver = await this.driverRepository.findOne({
      where: { id: driverId },
    });

    if (!driver) {
      throw new NotFoundException(`Motorista com ID ${driverId} não encontrado`);
    }

    driver.current_vehicle_id = undefined;
    const updated = await this.driverRepository.save(driver);

    this.logger.log(`Veículo removido do motorista ${driverId}`);

    return this.mapToResponseDto(updated);
  }

  // ===================================
  // Métodos Privados
  // ===================================

  /**
   * Obtém IDs de motoristas indisponíveis em uma data
   */
  private async getUnavailableDriverIds(date: Date): Promise<string[]> {
    const unavailabilities = await this.availabilityRepository.find({
      where: {
        is_active: true,
        start_date: LessThanOrEqual(date),
        end_date: MoreThanOrEqual(date),
        availability_type: Not(AvailabilityType.AVAILABLE),
      },
      select: ['driver_id'],
    });

    return unavailabilities.map(ua => ua.driver_id);
  }

  private mapToResponseDto(driver: Driver): DriverResponseDto {
    return {
      id: driver.id,
      cpf: driver.cpf,
      full_name: driver.full_name,
      birth_date:
        typeof driver.birth_date === 'string'
          ? driver.birth_date
          : (driver.birth_date?.toISOString().split('T')[0] ?? ''),
      email: driver.email,
      phone: driver.phone,
      status: driver.status,
      is_active: driver.is_active,
      cnh_number: driver.license?.license_number ?? '',
      cnh_category: driver.license?.category ?? CNHCategory.B,
      cnh_expiration_date:
        typeof driver.license?.expiration_date === 'string'
          ? driver.license.expiration_date
          : (driver.license?.expiration_date?.toISOString().split('T')[0] ?? ''),
      created_at: driver.created_at.toISOString(),
      updated_at: driver.updated_at.toISOString(),
    };
  }
}
