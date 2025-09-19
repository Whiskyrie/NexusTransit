import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { VehicleDocument } from './entities/vehicle-document.entity';
import { VehicleMaintenance } from './entities/vehicle-maintenance.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleFilterDto } from './dto/vehicle-filter.dto';
import { VehicleResponseDto } from './dto/vehicle-response.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { LicensePlateValidator } from './validators/license-plate.validator';
import { VehicleStatus } from './enums/vehicle-status.enum';

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @InjectRepository(VehicleDocument)
    private readonly vehicleDocumentRepository: Repository<VehicleDocument>,
    @InjectRepository(VehicleMaintenance)
    private readonly vehicleMaintenanceRepository: Repository<VehicleMaintenance>,
  ) {}

  async create(createVehicleDto: CreateVehicleDto): Promise<VehicleResponseDto> {
    // Validate and normalize license plate
    const normalizedPlate = LicensePlateValidator.normalize(createVehicleDto.licensePlate);

    if (!LicensePlateValidator.isValid(normalizedPlate)) {
      throw new BadRequestException('Placa de veículo inválida');
    }

    // Check if vehicle with this license plate already exists
    const existingVehicle = await this.vehicleRepository.findOne({
      where: { license_plate: normalizedPlate },
    });

    if (existingVehicle) {
      throw new BadRequestException(`Veículo com placa ${normalizedPlate} já existe`);
    }

    // Create vehicle
    const vehicle = this.vehicleRepository.create({
      license_plate: normalizedPlate,
      brand: createVehicleDto.brand,
      model: createVehicleDto.model,
      year: createVehicleDto.year,
      color: createVehicleDto.color,
      vehicle_type: createVehicleDto.vehicleType,
      fuel_type: createVehicleDto.fuelType,
      status: createVehicleDto.status || VehicleStatus.ACTIVE,
      chassis_number: createVehicleDto.chassisNumber,
      engine_number: createVehicleDto.engineNumber,
      renavam: createVehicleDto.renavam,
      seating_capacity: createVehicleDto.seatingCapacity,
      load_capacity: createVehicleDto.loadCapacity,
      fuel_tank_capacity: createVehicleDto.fuelTankCapacity,
      current_mileage: createVehicleDto.currentMileage || 0,
      purchase_date: createVehicleDto.purchaseDate,
      purchase_price: createVehicleDto.purchasePrice,
      insurance_policy_number: createVehicleDto.insurancePolicyNumber,
      insurance_company: createVehicleDto.insuranceCompany,
      insurance_expiry_date: createVehicleDto.insuranceExpiryDate,
      notes: createVehicleDto.notes,
    });

    const savedVehicle = await this.vehicleRepository.save(vehicle);

    this.logger.log(`Veículo criado: ${savedVehicle.license_plate} (${savedVehicle.id})`);

    return this.mapToResponseDto(savedVehicle);
  }

  async findAll(filterDto: VehicleFilterDto): Promise<PaginatedResponseDto<VehicleResponseDto>> {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      vehicleType,
      fuelType,
      brand,
      yearFrom,
      yearTo,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = filterDto;

    const queryBuilder = this.vehicleRepository
      .createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.documents', 'documents')
      .leftJoinAndSelect('vehicle.maintenances', 'maintenances');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(vehicle.license_plate ILIKE :search OR vehicle.brand ILIKE :search OR vehicle.model ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status && status.length > 0) {
      queryBuilder.andWhere('vehicle.status IN (:...status)', { status });
    }

    if (vehicleType && vehicleType.length > 0) {
      queryBuilder.andWhere('vehicle.vehicle_type IN (:...vehicleType)', { vehicleType });
    }

    if (fuelType && fuelType.length > 0) {
      queryBuilder.andWhere('vehicle.fuel_type IN (:...fuelType)', { fuelType });
    }

    if (brand && brand.length > 0) {
      queryBuilder.andWhere('vehicle.brand IN (:...brand)', { brand });
    }

    if (yearFrom) {
      queryBuilder.andWhere('vehicle.year >= :yearFrom', { yearFrom });
    }

    if (yearTo) {
      queryBuilder.andWhere('vehicle.year <= :yearTo', { yearTo });
    }

    // Apply sorting
    const validSortFields = [
      'created_at',
      'updated_at',
      'license_plate',
      'brand',
      'model',
      'year',
      'current_mileage',
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    queryBuilder.orderBy(`vehicle.${sortField}`, sortOrder.toUpperCase() as 'ASC' | 'DESC');

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Execute query
    const [vehicles, total] = await queryBuilder.getManyAndCount();

    // Map to response DTOs
    const data = vehicles.map(vehicle => this.mapToResponseDto(vehicle));

    return {
      data,
      meta: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_previous: page > 1,
        has_next: page < Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<VehicleResponseDto> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
      relations: ['documents', 'maintenances'],
    });

    if (!vehicle) {
      throw new NotFoundException(`Veículo com ID ${id} não encontrado`);
    }

    return this.mapToResponseDto(vehicle);
  }

  async findByLicensePlate(licensePlate: string): Promise<VehicleResponseDto> {
    const normalizedPlate = LicensePlateValidator.normalize(licensePlate);

    const vehicle = await this.vehicleRepository.findOne({
      where: { license_plate: normalizedPlate },
      relations: ['documents', 'maintenances'],
    });

    if (!vehicle) {
      throw new NotFoundException(`Veículo com placa ${normalizedPlate} não encontrado`);
    }

    return this.mapToResponseDto(vehicle);
  }

  async update(id: string, updateVehicleDto: UpdateVehicleDto): Promise<VehicleResponseDto> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException(`Veículo com ID ${id} não encontrado`);
    }

    // If updating license plate, validate it
    if (updateVehicleDto.licensePlate) {
      const normalizedPlate = LicensePlateValidator.normalize(updateVehicleDto.licensePlate);

      if (!LicensePlateValidator.isValid(normalizedPlate)) {
        throw new BadRequestException('Placa de veículo inválida');
      }

      // Check if another vehicle has this license plate
      const existingVehicle = await this.vehicleRepository.findOne({
        where: { license_plate: normalizedPlate },
      });

      if (existingVehicle && existingVehicle.id !== id) {
        throw new BadRequestException(`Veículo com placa ${normalizedPlate} já existe`);
      }

      vehicle.license_plate = normalizedPlate;
    }

    // Update other fields
    Object.assign(vehicle, {
      ...(updateVehicleDto.brand && { brand: updateVehicleDto.brand }),
      ...(updateVehicleDto.model && { model: updateVehicleDto.model }),
      ...(updateVehicleDto.year && { year: updateVehicleDto.year }),
      ...(updateVehicleDto.color && { color: updateVehicleDto.color }),
      ...(updateVehicleDto.vehicleType && { vehicle_type: updateVehicleDto.vehicleType }),
      ...(updateVehicleDto.fuelType && { fuel_type: updateVehicleDto.fuelType }),
      ...(updateVehicleDto.status && { status: updateVehicleDto.status }),
      ...(updateVehicleDto.chassisNumber && { chassis_number: updateVehicleDto.chassisNumber }),
      ...(updateVehicleDto.engineNumber && { engine_number: updateVehicleDto.engineNumber }),
      ...(updateVehicleDto.renavam && { renavam: updateVehicleDto.renavam }),
      ...(updateVehicleDto.seatingCapacity && {
        seating_capacity: updateVehicleDto.seatingCapacity,
      }),
      ...(updateVehicleDto.loadCapacity && { load_capacity: updateVehicleDto.loadCapacity }),
      ...(updateVehicleDto.fuelTankCapacity && {
        fuel_tank_capacity: updateVehicleDto.fuelTankCapacity,
      }),
      ...(updateVehicleDto.currentMileage !== undefined && {
        current_mileage: updateVehicleDto.currentMileage,
      }),
      ...(updateVehicleDto.purchaseDate && { purchase_date: updateVehicleDto.purchaseDate }),
      ...(updateVehicleDto.purchasePrice && { purchase_price: updateVehicleDto.purchasePrice }),
      ...(updateVehicleDto.insurancePolicyNumber && {
        insurance_policy_number: updateVehicleDto.insurancePolicyNumber,
      }),
      ...(updateVehicleDto.insuranceCompany && {
        insurance_company: updateVehicleDto.insuranceCompany,
      }),
      ...(updateVehicleDto.insuranceExpiryDate && {
        insurance_expiry_date: updateVehicleDto.insuranceExpiryDate,
      }),
      ...(updateVehicleDto.notes !== undefined && { notes: updateVehicleDto.notes }),
    });

    const updatedVehicle = await this.vehicleRepository.save(vehicle);

    this.logger.log(`Veículo atualizado: ${updatedVehicle.license_plate} (${updatedVehicle.id})`);

    return this.mapToResponseDto(updatedVehicle);
  }

  async remove(id: string): Promise<void> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException(`Veículo com ID ${id} não encontrado`);
    }

    await this.vehicleRepository.remove(vehicle);

    this.logger.log(`Veículo removido: ${vehicle.license_plate} (${id})`);
  }

  async updateMileage(id: string, mileage: number): Promise<VehicleResponseDto> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException(`Veículo com ID ${id} não encontrado`);
    }

    if (mileage < vehicle.current_mileage) {
      throw new BadRequestException('Nova quilometragem não pode ser menor que a atual');
    }

    vehicle.current_mileage = mileage;
    const updatedVehicle = await this.vehicleRepository.save(vehicle);

    this.logger.log(`Quilometragem atualizada: ${vehicle.license_plate} -> ${mileage} km`);

    return this.mapToResponseDto(updatedVehicle);
  }

  async getVehicleStats() {
    const stats = await this.vehicleRepository
      .createQueryBuilder('vehicle')
      .select([
        'COUNT(*) as total',
        'COUNT(CASE WHEN vehicle.status = :active THEN 1 END) as active',
        'COUNT(CASE WHEN vehicle.status = :inactive THEN 1 END) as inactive',
        'COUNT(CASE WHEN vehicle.status = :maintenance THEN 1 END) as in_maintenance',
        'AVG(vehicle.current_mileage) as avg_mileage',
      ])
      .setParameters({
        active: VehicleStatus.ACTIVE,
        inactive: VehicleStatus.INACTIVE,
        maintenance: VehicleStatus.MAINTENANCE,
      })
      .getRawOne();

    return {
      total: parseInt(stats.total),
      active: parseInt(stats.active),
      inactive: parseInt(stats.inactive),
      inMaintenance: parseInt(stats.in_maintenance),
      averageMileage: parseFloat(stats.avg_mileage) || 0,
    };
  }

  private mapToResponseDto(vehicle: Vehicle): VehicleResponseDto {
    return {
      id: vehicle.id,
      licensePlate: vehicle.license_plate,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      vehicleType: vehicle.vehicle_type,
      fuelType: vehicle.fuel_type,
      status: vehicle.status,
      chassisNumber: vehicle.chassis_number,
      engineNumber: vehicle.engine_number,
      renavam: vehicle.renavam,
      seatingCapacity: vehicle.seating_capacity,
      loadCapacity: vehicle.load_capacity,
      fuelTankCapacity: vehicle.fuel_tank_capacity,
      currentMileage: vehicle.current_mileage,
      purchaseDate: vehicle.purchase_date,
      purchasePrice: vehicle.purchase_price,
      insurancePolicyNumber: vehicle.insurance_policy_number,
      insuranceCompany: vehicle.insurance_company,
      insuranceExpiryDate: vehicle.insurance_expiry_date,
      notes: vehicle.notes,
      createdAt: vehicle.created_at,
      updatedAt: vehicle.updated_at,
      documentsCount: vehicle.documents?.length || 0,
      maintenancesCount: vehicle.maintenances?.length || 0,
      lastMaintenanceDate:
        vehicle.maintenances?.length > 0
          ? vehicle.maintenances.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())[0]
              .created_at
          : undefined,
    };
  }
}
