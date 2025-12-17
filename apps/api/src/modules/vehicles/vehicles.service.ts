import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThan, In } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { VehicleDocument } from './entities/vehicle-document.entity';
import { VehicleMaintenance } from './entities/vehicle-maintenance.entity';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleFilterDto,
  VehicleResponseDto,
  UploadDocumentDto,
  DocumentResponseDto,
  DocumentType,
  CreateMaintenanceDto,
  UpdateMaintenanceDto,
  CompleteMaintenanceDto,
  MaintenanceResponseDto,
  AlertSummaryDto,
} from './dto';
import {
  normalizeLicensePlate,
  IsLicensePlateConstraint,
  PaginatedResponseDto,
} from '@nexus/common';
import { VehicleStatus, FuelType, MaintenanceStatus } from './enums';
import { StorageService } from '@nexus/storage';

import { FileValidationUtils } from './config/upload.config';
import { extname } from 'path';

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
    private readonly storageService: StorageService,
  ) {}

  async create(createVehicleDto: CreateVehicleDto): Promise<VehicleResponseDto> {
    // Validate and normalize license plate
    const normalizedPlate = normalizeLicensePlate(createVehicleDto.license_plate);

    const constraint = new IsLicensePlateConstraint();
    if (!constraint.validate(normalizedPlate)) {
      throw new BadRequestException('Placa de veículo inválida');
    }

    // Check if vehicle with this license plate already exists
    const existingVehicle = await this.vehicleRepository.findOne({
      where: { license_plate: normalizedPlate },
    });

    if (existingVehicle) {
      throw new BadRequestException(`Veículo com placa ${normalizedPlate} já existe`);
    }

    // Create vehicle with only defined properties
    const vehicleData: Partial<Vehicle> = {
      license_plate: normalizedPlate,
      brand: createVehicleDto.brand,
      model: createVehicleDto.model,
      year: createVehicleDto.year,
      vehicle_type: createVehicleDto.vehicle_type,
      fuel_type: createVehicleDto.fuel_type,
      status: createVehicleDto.status ?? VehicleStatus.ACTIVE,
      mileage: createVehicleDto.mileage ?? 0,
      has_gps: createVehicleDto.has_gps ?? false,
      has_refrigeration: createVehicleDto.has_refrigeration ?? false,
    };

    // Add optional fields only if they exist
    if (createVehicleDto.color) {
      vehicleData.color = createVehicleDto.color;
    }
    if (createVehicleDto.load_capacity) {
      vehicleData.load_capacity = createVehicleDto.load_capacity;
    }
    if (createVehicleDto.cargo_volume) {
      vehicleData.cargo_volume = createVehicleDto.cargo_volume;
    }
    if (createVehicleDto.fuel_capacity) {
      vehicleData.fuel_capacity = createVehicleDto.fuel_capacity;
    }
    if (createVehicleDto.last_maintenance_at) {
      vehicleData.last_maintenance_at = new Date(createVehicleDto.last_maintenance_at);
    }
    if (createVehicleDto.next_maintenance_at) {
      vehicleData.next_maintenance_at = new Date(createVehicleDto.next_maintenance_at);
    }
    if (createVehicleDto.next_maintenance_km) {
      vehicleData.next_maintenance_km = createVehicleDto.next_maintenance_km;
    }
    if (createVehicleDto.chassis_number) {
      vehicleData.chassis_number = createVehicleDto.chassis_number;
    }
    if (createVehicleDto.renavam) {
      vehicleData.renavam = createVehicleDto.renavam;
    }
    if (createVehicleDto.acquisition_date) {
      vehicleData.acquisition_date = new Date(createVehicleDto.acquisition_date);
    }
    if (createVehicleDto.acquisition_value) {
      vehicleData.acquisition_value = createVehicleDto.acquisition_value;
    }
    if (createVehicleDto.average_consumption) {
      vehicleData.average_consumption = createVehicleDto.average_consumption;
    }
    if (createVehicleDto.insurance_company) {
      vehicleData.insurance_company = createVehicleDto.insurance_company;
    }
    if (createVehicleDto.insurance_policy_number) {
      vehicleData.insurance_policy_number = createVehicleDto.insurance_policy_number;
    }
    if (createVehicleDto.insurance_expiry_date) {
      vehicleData.insurance_expiry_date = new Date(createVehicleDto.insurance_expiry_date);
    }
    if (createVehicleDto.license_expiry_date) {
      vehicleData.license_expiry_date = new Date(createVehicleDto.license_expiry_date);
    }
    if (createVehicleDto.notes) {
      vehicleData.notes = createVehicleDto.notes;
    }
    if (createVehicleDto.insurance_info) {
      vehicleData.insurance_info = createVehicleDto.insurance_info;
    }
    if (createVehicleDto.specifications) {
      vehicleData.specifications = createVehicleDto.specifications;
    }

    const vehicle = this.vehicleRepository.create(vehicleData);
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
      license_plate_type,
      insurance_expiring,
      license_expiring,
      order_by = 'created_at',
      order_direction = 'DESC',
    } = filterDto;

    const queryBuilder = this.vehicleRepository
      .createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.documents', 'documents')
      .leftJoinAndSelect('vehicle.maintenances', 'maintenances')
      .leftJoinAndSelect('vehicle.driverHistories', 'driverHistories');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(vehicle.license_plate ILIKE :search OR vehicle.brand ILIKE :search OR vehicle.model ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      queryBuilder.andWhere('vehicle.status = :status', { status });
    }

    if (license_plate_type) {
      queryBuilder.andWhere('vehicle.license_plate_type = :license_plate_type', {
        license_plate_type,
      });
    }

    if (insurance_expiring) {
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      queryBuilder.andWhere('vehicle.insurance_expiry_date BETWEEN :today AND :thirtyDaysFromNow', {
        today,
        thirtyDaysFromNow,
      });
    }

    if (license_expiring) {
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      queryBuilder.andWhere('vehicle.license_expiry_date BETWEEN :today AND :thirtyDaysFromNow', {
        today,
        thirtyDaysFromNow,
      });
    }

    // Apply sorting
    const validSortFields = [
      'created_at',
      'updated_at',
      'license_plate',
      'brand',
      'model',
      'year',
      'mileage',
    ];
    const sortField = validSortFields.includes(order_by) ? order_by : 'created_at';
    queryBuilder.orderBy(`vehicle.${sortField}`, order_direction);

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
      relations: ['documents', 'maintenances', 'driverHistories'],
    });

    if (!vehicle) {
      throw new NotFoundException(`Veículo com ID ${id} não encontrado`);
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
    if (updateVehicleDto.license_plate) {
      const normalizedPlate = normalizeLicensePlate(updateVehicleDto.license_plate);

      const constraint = new IsLicensePlateConstraint();
      if (!constraint.validate(normalizedPlate)) {
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
      ...(updateVehicleDto.vehicle_type && { vehicle_type: updateVehicleDto.vehicle_type }),
      ...(updateVehicleDto.fuel_type && { fuel_type: updateVehicleDto.fuel_type }),
      ...(updateVehicleDto.status && { status: updateVehicleDto.status }),
      ...(updateVehicleDto.load_capacity && { load_capacity: updateVehicleDto.load_capacity }),
      ...(updateVehicleDto.cargo_volume && { cargo_volume: updateVehicleDto.cargo_volume }),
      ...(updateVehicleDto.fuel_capacity && { fuel_capacity: updateVehicleDto.fuel_capacity }),
      ...(updateVehicleDto.mileage !== undefined && { mileage: updateVehicleDto.mileage }),
      ...(updateVehicleDto.next_maintenance_km && {
        next_maintenance_km: updateVehicleDto.next_maintenance_km,
      }),
      ...(updateVehicleDto.chassis_number && { chassis_number: updateVehicleDto.chassis_number }),
      ...(updateVehicleDto.renavam && { renavam: updateVehicleDto.renavam }),
      ...(updateVehicleDto.acquisition_date && {
        acquisition_date: new Date(updateVehicleDto.acquisition_date),
      }),
      ...(updateVehicleDto.acquisition_value && {
        acquisition_value: updateVehicleDto.acquisition_value,
      }),
      ...(updateVehicleDto.average_consumption && {
        average_consumption: updateVehicleDto.average_consumption,
      }),
      ...(updateVehicleDto.insurance_company && {
        insurance_company: updateVehicleDto.insurance_company,
      }),
      ...(updateVehicleDto.insurance_policy_number && {
        insurance_policy_number: updateVehicleDto.insurance_policy_number,
      }),
      ...(updateVehicleDto.insurance_expiry_date && {
        insurance_expiry_date: new Date(updateVehicleDto.insurance_expiry_date),
      }),
      ...(updateVehicleDto.license_expiry_date && {
        license_expiry_date: new Date(updateVehicleDto.license_expiry_date),
      }),
      ...(updateVehicleDto.notes && { notes: updateVehicleDto.notes }),
    });

    const updatedVehicle = await this.vehicleRepository.save(vehicle);

    this.logger.log(`Veículo atualizado: ${updatedVehicle.license_plate} (${updatedVehicle.id})`);

    return this.mapToResponseDto(updatedVehicle);
  }

  async replace(id: string, createVehicleDto: CreateVehicleDto): Promise<VehicleResponseDto> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException(`Veículo com ID ${id} não encontrado`);
    }

    // Validate and normalize license plate
    const normalizedPlate = normalizeLicensePlate(createVehicleDto.license_plate);

    const constraint = new IsLicensePlateConstraint();
    if (!constraint.validate(normalizedPlate)) {
      throw new BadRequestException('Placa de veículo inválida');
    }

    // Check if another vehicle has this license plate
    const existingVehicle = await this.vehicleRepository.findOne({
      where: { license_plate: normalizedPlate },
    });

    if (existingVehicle && existingVehicle.id !== id) {
      throw new BadRequestException(`Veículo com placa ${normalizedPlate} já existe`);
    }

    // Validate status transition if status is changing
    if (createVehicleDto.status && createVehicleDto.status !== vehicle.status) {
      this.validateStatusTransition(vehicle.status, createVehicleDto.status);
    }

    // Replace all vehicle data with new data
    const vehicleData: Partial<Vehicle> = {
      license_plate: normalizedPlate,
      brand: createVehicleDto.brand,
      model: createVehicleDto.model,
      year: createVehicleDto.year,
      vehicle_type: createVehicleDto.vehicle_type,
      fuel_type: createVehicleDto.fuel_type,
      status: createVehicleDto.status ?? VehicleStatus.ACTIVE,
      mileage: createVehicleDto.mileage ?? 0,
      has_gps: createVehicleDto.has_gps ?? false,
      has_refrigeration: createVehicleDto.has_refrigeration ?? false,
    };

    // Add optional fields only if they exist
    if (createVehicleDto.color) {
      vehicleData.color = createVehicleDto.color;
    }
    if (createVehicleDto.load_capacity) {
      vehicleData.load_capacity = createVehicleDto.load_capacity;
    }
    if (createVehicleDto.cargo_volume) {
      vehicleData.cargo_volume = createVehicleDto.cargo_volume;
    }
    if (createVehicleDto.fuel_capacity) {
      vehicleData.fuel_capacity = createVehicleDto.fuel_capacity;
    }
    if (createVehicleDto.passenger_capacity) {
      vehicleData.passenger_capacity = createVehicleDto.passenger_capacity;
    }
    if (createVehicleDto.last_maintenance_at) {
      vehicleData.last_maintenance_at = new Date(createVehicleDto.last_maintenance_at);
    }
    if (createVehicleDto.next_maintenance_at) {
      vehicleData.next_maintenance_at = new Date(createVehicleDto.next_maintenance_at);
    }
    if (createVehicleDto.next_maintenance_km) {
      vehicleData.next_maintenance_km = createVehicleDto.next_maintenance_km;
    }
    if (createVehicleDto.chassis_number) {
      vehicleData.chassis_number = createVehicleDto.chassis_number;
    }
    if (createVehicleDto.renavam) {
      vehicleData.renavam = createVehicleDto.renavam;
    }
    if (createVehicleDto.acquisition_date) {
      vehicleData.acquisition_date = new Date(createVehicleDto.acquisition_date);
    }
    if (createVehicleDto.acquisition_value) {
      vehicleData.acquisition_value = createVehicleDto.acquisition_value;
    }
    if (createVehicleDto.average_consumption) {
      vehicleData.average_consumption = createVehicleDto.average_consumption;
    }
    if (createVehicleDto.insurance_company) {
      vehicleData.insurance_company = createVehicleDto.insurance_company;
    }
    if (createVehicleDto.insurance_policy_number) {
      vehicleData.insurance_policy_number = createVehicleDto.insurance_policy_number;
    }
    if (createVehicleDto.insurance_expiry_date) {
      vehicleData.insurance_expiry_date = new Date(createVehicleDto.insurance_expiry_date);
    }
    if (createVehicleDto.license_expiry_date) {
      vehicleData.license_expiry_date = new Date(createVehicleDto.license_expiry_date);
    }
    if (createVehicleDto.notes) {
      vehicleData.notes = createVehicleDto.notes;
    }
    if (createVehicleDto.insurance_info) {
      vehicleData.insurance_info = createVehicleDto.insurance_info;
    }
    if (createVehicleDto.specifications) {
      vehicleData.specifications = createVehicleDto.specifications;
    }

    // Update vehicle with new data
    Object.assign(vehicle, vehicleData);
    const replacedVehicle = await this.vehicleRepository.save(vehicle);

    this.logger.log(
      `Veículo substituído: ${replacedVehicle.license_plate} (${replacedVehicle.id})`,
    );

    return this.mapToResponseDto(replacedVehicle);
  }

  async remove(id: string): Promise<void> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException(`Veículo com ID ${id} não encontrado`);
    }

    await this.vehicleRepository.softRemove(vehicle);

    this.logger.log(`Veículo removido: ${vehicle.license_plate} (${id})`);
  }

  // Métodos para gerenciamento de documentos

  async uploadDocuments(
    vehicleId: string,
    files: Express.Multer.File[],
    uploadDocumentDto: UploadDocumentDto,
  ): Promise<DocumentResponseDto[]> {
    // Verify vehicle exists
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(`Veículo com ID ${vehicleId} não encontrado`);
    }

    const uploadedDocuments: DocumentResponseDto[] = [];

    for (const file of files) {
      // Validate file
      if (!FileValidationUtils.validateMimeType(file.mimetype)) {
        throw new BadRequestException(`Tipo de arquivo não permitido: ${file.mimetype}`);
      }

      // Upload file to storage
      const uploadResult = await this.storageService.uploadFile(
        file,
        'vehicles/documents',
        vehicleId,
      );

      // Format file size
      const fileSizeFormatted = this.formatFileSize(file.size);
      const fileExtension = extname(file.originalname).toLowerCase().replace('.', '');

      // Create document record
      const documentData: Partial<VehicleDocument> = {
        vehicle_id: vehicleId,
        document_type: uploadDocumentDto.document_type,
        original_name: file.originalname,
        file_path: uploadResult.filePath,
        file_size: fileSizeFormatted,
        file_size_bytes: file.size,
        file_extension: fileExtension,
        mime_type: file.mimetype,
        is_active: true,
        file_hash: uploadResult.fileHash,
      };

      // Add optional fields only if they exist
      if (uploadDocumentDto.expiry_date) {
        documentData.expiry_date = new Date(uploadDocumentDto.expiry_date);
      }
      if (uploadDocumentDto.description) {
        documentData.description = uploadDocumentDto.description;
      }

      const document = this.vehicleDocumentRepository.create(documentData);
      const savedDocument = await this.vehicleDocumentRepository.save(document);

      uploadedDocuments.push(this.mapDocumentToResponseDto(savedDocument));
    }

    this.logger.log(`${files.length} documento(s) enviado(s) para veículo ${vehicleId}`);

    return uploadedDocuments;
  }

  async getDocuments(vehicleId: string): Promise<DocumentResponseDto[]> {
    // Verify vehicle exists
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(`Veículo com ID ${vehicleId} não encontrado`);
    }

    const documents = await this.vehicleDocumentRepository.find({
      where: {
        vehicle_id: vehicleId,
        is_active: true,
      },
      order: { created_at: 'DESC' },
    });

    return documents.map(doc => this.mapDocumentToResponseDto(doc));
  }

  async updateDocument(
    vehicleId: string,
    documentId: string,
    updateData: Partial<UploadDocumentDto>,
  ): Promise<DocumentResponseDto> {
    // Verify vehicle exists
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(`Veículo com ID ${vehicleId} não encontrado`);
    }

    // Find document
    const document = await this.vehicleDocumentRepository.findOne({
      where: {
        id: documentId,
        vehicle_id: vehicleId,
        is_active: true,
      },
    });

    if (!document) {
      throw new NotFoundException(`Documento com ID ${documentId} não encontrado`);
    }

    // Update document
    if (updateData.document_type) {
      document.document_type = updateData.document_type;
    }
    if (updateData.expiry_date) {
      document.expiry_date = new Date(updateData.expiry_date);
    }
    if (updateData.description !== undefined) {
      document.description = updateData.description;
    }

    const updatedDocument = await this.vehicleDocumentRepository.save(document);

    this.logger.log(`Documento ${documentId} atualizado para veículo ${vehicleId}`);

    return this.mapDocumentToResponseDto(updatedDocument);
  }

  async removeDocument(vehicleId: string, documentId: string): Promise<void> {
    // Verify vehicle exists
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(`Veículo com ID ${vehicleId} não encontrado`);
    }

    // Find document
    const document = await this.vehicleDocumentRepository.findOne({
      where: {
        id: documentId,
        vehicle_id: vehicleId,
        is_active: true,
      },
    });

    if (!document) {
      throw new NotFoundException(`Documento com ID ${documentId} não encontrado`);
    }

    // Soft delete (mark as inactive)
    document.is_active = false;
    await this.vehicleDocumentRepository.save(document);

    this.logger.log(`Documento ${documentId} removido do veículo ${vehicleId}`);
  }

  private mapToResponseDto(vehicle: Vehicle): VehicleResponseDto {
    const currentYear = new Date().getFullYear();
    const age = currentYear - vehicle.year;
    const isElectric = vehicle.fuel_type === FuelType.ELECTRIC;
    const isAvailable = vehicle.status === VehicleStatus.ACTIVE;
    const needsMaintenance = vehicle.next_maintenance_at
      ? new Date(vehicle.next_maintenance_at) <= new Date()
      : false;

    return {
      id: vehicle.id,
      license_plate: vehicle.license_plate,
      license_plate_type: vehicle.license_plate_type,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      vehicle_type: vehicle.vehicle_type,
      fuel_type: vehicle.fuel_type,
      status: vehicle.status,
      load_capacity: vehicle.load_capacity,
      cargo_volume: vehicle.cargo_volume,
      fuel_capacity: vehicle.fuel_capacity,
      mileage: vehicle.mileage,
      passenger_capacity: vehicle.passenger_capacity,
      last_maintenance_at: vehicle.last_maintenance_at,
      next_maintenance_at: vehicle.next_maintenance_at,
      next_maintenance_km: vehicle.next_maintenance_km,
      chassis_number: vehicle.chassis_number,
      renavam: vehicle.renavam,
      acquisition_date: vehicle.acquisition_date,
      acquisition_value: vehicle.acquisition_value,
      average_consumption: vehicle.average_consumption,
      insurance_company: vehicle.insurance_company,
      insurance_policy_number: vehicle.insurance_policy_number,
      insurance_expiry_date: vehicle.insurance_expiry_date,
      license_expiry_date: vehicle.license_expiry_date,
      notes: vehicle.notes,
      has_gps: vehicle.has_gps,
      has_refrigeration: vehicle.has_refrigeration,
      insurance_info: vehicle.insurance_info,
      specifications: vehicle.specifications,
      created_at: vehicle.created_at,
      updated_at: vehicle.updated_at,
      // Propriedades computadas
      is_available: isAvailable,
      needs_maintenance: needsMaintenance,
      age,
      is_electric: isElectric,
      full_identification: `${vehicle.brand} ${vehicle.model} (${vehicle.year}) - ${vehicle.license_plate}`,
    } as VehicleResponseDto;
  }

  private mapDocumentToResponseDto(document: VehicleDocument): DocumentResponseDto {
    const dto: DocumentResponseDto = {
      id: document.id,
      document_type: document.document_type,
      original_name: document.original_name,
      file_path: document.file_path,
      file_size: document.file_size,
      file_extension: document.file_extension,
      is_active: document.is_active,
      created_at: document.created_at,
      updated_at: document.updated_at,
    };

    // Add optional fields only if they exist
    if (document.expiry_date) {
      dto.expiry_date = document.expiry_date;
    }
    if (document.description) {
      dto.description = document.description;
    }

    return dto;
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Valida as transições de status permitidas para veículos
   * @param currentStatus Status atual do veículo
   * @param newStatus Novo status solicitado
   * @throws BadRequestException se a transição não for permitida
   */
  private validateStatusTransition(currentStatus: VehicleStatus, newStatus: VehicleStatus): void {
    // Definir as transições permitidas
    const allowedTransitions: Record<VehicleStatus, VehicleStatus[]> = {
      [VehicleStatus.ACTIVE]: [
        VehicleStatus.INACTIVE,
        VehicleStatus.MAINTENANCE,
        VehicleStatus.OUT_OF_SERVICE,
        VehicleStatus.IN_ROUTE,
      ],
      [VehicleStatus.INACTIVE]: [
        VehicleStatus.ACTIVE,
        VehicleStatus.MAINTENANCE,
        VehicleStatus.OUT_OF_SERVICE,
      ],
      [VehicleStatus.MAINTENANCE]: [
        VehicleStatus.ACTIVE,
        VehicleStatus.INACTIVE,
        VehicleStatus.OUT_OF_SERVICE,
      ],
      [VehicleStatus.OUT_OF_SERVICE]: [
        VehicleStatus.ACTIVE,
        VehicleStatus.INACTIVE,
        VehicleStatus.MAINTENANCE,
      ],
      [VehicleStatus.IN_ROUTE]: [
        VehicleStatus.ACTIVE,
        VehicleStatus.MAINTENANCE,
        VehicleStatus.OUT_OF_SERVICE,
      ],
    };

    // Verificar se a transição é permitida
    const allowed = allowedTransitions[currentStatus];
    if (!allowed?.includes(newStatus)) {
      throw new BadRequestException(
        `Transição de status não permitida: ${currentStatus} -> ${newStatus}`,
      );
    }
  }
}
