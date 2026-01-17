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

    const queryBuilder = this.vehicleRepository.createQueryBuilder('vehicle');
    // Removendo joins temporariamente para identificar problema
    // .leftJoinAndSelect('vehicle.documents', 'documents')
    // .leftJoinAndSelect('vehicle.maintenances', 'maintenances')
    // .leftJoinAndSelect('vehicle.driverHistories', 'driverHistories');

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
        { fileType: 'documents' },
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

  async getExpiringDocuments(days = 30): Promise<DocumentResponseDto[]> {
    const today = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(today.getDate() + days);

    const documents = await this.vehicleDocumentRepository.find({
      where: {
        is_active: true,
        expiry_date: Between(today, expiryDate),
      },
      relations: ['vehicle'],
      order: { expiry_date: 'ASC' },
    });

    return documents.map(doc => this.mapDocumentToResponseDto(doc));
  }

  async getExpiredDocuments(): Promise<DocumentResponseDto[]> {
    const today = new Date();

    const documents = await this.vehicleDocumentRepository.find({
      where: {
        is_active: true,
        expiry_date: LessThan(today),
      },
      relations: ['vehicle'],
      order: { expiry_date: 'ASC' },
    });

    return documents.map(doc => this.mapDocumentToResponseDto(doc));
  }

  // Métodos para gerenciamento de manutenções

  async createMaintenance(
    vehicleId: string,
    createMaintenanceDto: CreateMaintenanceDto,
  ): Promise<MaintenanceResponseDto> {
    // Verify vehicle exists
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(`Veículo com ID ${vehicleId} não encontrado`);
    }

    // Create maintenance record
    const maintenanceData: Partial<VehicleMaintenance> = {
      vehicle_id: vehicleId,
      maintenance_type: createMaintenanceDto.maintenance_type,
      title: createMaintenanceDto.title,
      description: createMaintenanceDto.description,
      maintenance_date: new Date(createMaintenanceDto.maintenance_date),
      mileage_at_maintenance: createMaintenanceDto.mileage_at_maintenance,
      status: MaintenanceStatus.SCHEDULED,
    };

    // Add optional fields only if they exist
    if (createMaintenanceDto.service_provider) {
      maintenanceData.service_provider = createMaintenanceDto.service_provider;
    }
    if (createMaintenanceDto.service_provider_contact) {
      maintenanceData.service_provider_contact = createMaintenanceDto.service_provider_contact;
    }
    if (createMaintenanceDto.service_location) {
      maintenanceData.service_location = createMaintenanceDto.service_location;
    }
    if (createMaintenanceDto.next_maintenance_date) {
      maintenanceData.next_maintenance_date = new Date(createMaintenanceDto.next_maintenance_date);
    }
    if (createMaintenanceDto.next_maintenance_mileage) {
      maintenanceData.next_maintenance_mileage = createMaintenanceDto.next_maintenance_mileage;
    }
    if (createMaintenanceDto.service_order_number) {
      maintenanceData.service_order_number = createMaintenanceDto.service_order_number;
    }
    if (createMaintenanceDto.warranty_period) {
      maintenanceData.warranty_period = createMaintenanceDto.warranty_period;
    }
    if (createMaintenanceDto.warranty_expiry_date) {
      maintenanceData.warranty_expiry_date = new Date(createMaintenanceDto.warranty_expiry_date);
    }
    if (createMaintenanceDto.parts_used) {
      maintenanceData.parts_used = createMaintenanceDto.parts_used;
    }
    if (createMaintenanceDto.services_performed) {
      maintenanceData.services_performed = createMaintenanceDto.services_performed;
    }
    if (createMaintenanceDto.notes) {
      maintenanceData.notes = createMaintenanceDto.notes;
    }

    const maintenance = this.vehicleMaintenanceRepository.create(maintenanceData);
    const savedMaintenance = await this.vehicleMaintenanceRepository.save(maintenance);

    this.logger.log(`Manutenção agendada: ${savedMaintenance.id} para veículo ${vehicleId}`);

    return this.mapMaintenanceToResponseDto(savedMaintenance);
  }

  async getMaintenances(vehicleId: string): Promise<MaintenanceResponseDto[]> {
    // Verify vehicle exists
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(`Veículo com ID ${vehicleId} não encontrado`);
    }

    const maintenances = await this.vehicleMaintenanceRepository.find({
      where: { vehicle_id: vehicleId },
      order: { maintenance_date: 'DESC' },
    });

    return maintenances.map(maintenance => this.mapMaintenanceToResponseDto(maintenance));
  }

  async updateMaintenance(
    vehicleId: string,
    maintenanceId: string,
    updateMaintenanceDto: UpdateMaintenanceDto,
  ): Promise<MaintenanceResponseDto> {
    // Verify vehicle exists
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(`Veículo com ID ${vehicleId} não encontrado`);
    }

    // Find maintenance
    const maintenance = await this.vehicleMaintenanceRepository.findOne({
      where: { id: maintenanceId, vehicle_id: vehicleId },
    });

    if (!maintenance) {
      throw new NotFoundException(`Manutenção com ID ${maintenanceId} não encontrada`);
    }

    // Update maintenance
    if (updateMaintenanceDto.maintenance_type) {
      maintenance.maintenance_type = updateMaintenanceDto.maintenance_type;
    }
    if (updateMaintenanceDto.title) {
      maintenance.title = updateMaintenanceDto.title;
    }
    if (updateMaintenanceDto.description) {
      maintenance.description = updateMaintenanceDto.description;
    }
    if (updateMaintenanceDto.maintenance_date) {
      maintenance.maintenance_date = new Date(updateMaintenanceDto.maintenance_date);
    }
    if (updateMaintenanceDto.mileage_at_maintenance) {
      maintenance.mileage_at_maintenance = updateMaintenanceDto.mileage_at_maintenance;
    }
    if (updateMaintenanceDto.service_provider) {
      maintenance.service_provider = updateMaintenanceDto.service_provider;
    }
    if (updateMaintenanceDto.service_provider_contact) {
      maintenance.service_provider_contact = updateMaintenanceDto.service_provider_contact;
    }
    if (updateMaintenanceDto.service_location) {
      maintenance.service_location = updateMaintenanceDto.service_location;
    }
    if (updateMaintenanceDto.next_maintenance_date) {
      maintenance.next_maintenance_date = new Date(updateMaintenanceDto.next_maintenance_date);
    }
    if (updateMaintenanceDto.next_maintenance_mileage) {
      maintenance.next_maintenance_mileage = updateMaintenanceDto.next_maintenance_mileage;
    }
    if (updateMaintenanceDto.service_order_number) {
      maintenance.service_order_number = updateMaintenanceDto.service_order_number;
    }
    if (updateMaintenanceDto.warranty_period) {
      maintenance.warranty_period = updateMaintenanceDto.warranty_period;
    }
    if (updateMaintenanceDto.warranty_expiry_date) {
      maintenance.warranty_expiry_date = new Date(updateMaintenanceDto.warranty_expiry_date);
    }
    if (updateMaintenanceDto.parts_used) {
      maintenance.parts_used = updateMaintenanceDto.parts_used;
    }
    if (updateMaintenanceDto.services_performed) {
      maintenance.services_performed = updateMaintenanceDto.services_performed;
    }
    if (updateMaintenanceDto.notes) {
      maintenance.notes = updateMaintenanceDto.notes;
    }

    const updatedMaintenance = await this.vehicleMaintenanceRepository.save(maintenance);

    this.logger.log(`Manutenção atualizada: ${updatedMaintenance.id} para veículo ${vehicleId}`);

    return this.mapMaintenanceToResponseDto(updatedMaintenance);
  }

  async completeMaintenance(
    vehicleId: string,
    maintenanceId: string,
    completeMaintenanceDto: CompleteMaintenanceDto,
  ): Promise<MaintenanceResponseDto> {
    // Verify vehicle exists
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(`Veículo com ID ${vehicleId} não encontrado`);
    }

    // Find maintenance
    const maintenance = await this.vehicleMaintenanceRepository.findOne({
      where: { id: maintenanceId, vehicle_id: vehicleId },
    });

    if (!maintenance) {
      throw new NotFoundException(`Manutenção com ID ${maintenanceId} não encontrada`);
    }

    if (
      maintenance.status !== MaintenanceStatus.SCHEDULED &&
      maintenance.status !== MaintenanceStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        `Não é possível concluir uma manutenção com status ${maintenance.status}`,
      );
    }

    // Update maintenance status and completion details
    maintenance.status = MaintenanceStatus.COMPLETED;
    maintenance.completion_date = new Date();
    maintenance.service_rating = completeMaintenanceDto.service_rating;
    maintenance.rating_comments = completeMaintenanceDto.rating_comments;

    const completedMaintenance = await this.vehicleMaintenanceRepository.save(maintenance);

    this.logger.log(`Manutenção concluída: ${completedMaintenance.id} para veículo ${vehicleId}`);

    return this.mapMaintenanceToResponseDto(completedMaintenance);
  }

  async cancelMaintenance(vehicleId: string, maintenanceId: string): Promise<void> {
    // Verify vehicle exists
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(`Veículo com ID ${vehicleId} não encontrado`);
    }

    // Find maintenance
    const maintenance = await this.vehicleMaintenanceRepository.findOne({
      where: { id: maintenanceId, vehicle_id: vehicleId },
    });

    if (!maintenance) {
      throw new NotFoundException(`Manutenção com ID ${maintenanceId} não encontrada`);
    }

    if (maintenance.status === MaintenanceStatus.COMPLETED) {
      throw new BadRequestException('Não é possível cancelar uma manutenção já concluída');
    }

    // Update maintenance status
    maintenance.status = MaintenanceStatus.CANCELLED;

    await this.vehicleMaintenanceRepository.save(maintenance);

    this.logger.log(`Manutenção cancelada: ${maintenanceId} para veículo ${vehicleId}`);
  }

  async getScheduledMaintenances(): Promise<MaintenanceResponseDto[]> {
    const maintenances = await this.vehicleMaintenanceRepository.find({
      where: {
        status: MaintenanceStatus.SCHEDULED,
        maintenance_date: MoreThan(new Date()),
      },
      relations: ['vehicle'],
      order: { maintenance_date: 'ASC' },
    });

    return maintenances.map(maintenance => this.mapMaintenanceToResponseDto(maintenance));
  }

  async getOverdueMaintenances(): Promise<MaintenanceResponseDto[]> {
    const today = new Date();

    const maintenances = await this.vehicleMaintenanceRepository.find({
      where: {
        status: In([MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS]),
        maintenance_date: LessThan(today),
      },
      relations: ['vehicle'],
      order: { maintenance_date: 'ASC' },
    });

    return maintenances.map(maintenance => this.mapMaintenanceToResponseDto(maintenance));
  }

  private mapMaintenanceToResponseDto(maintenance: VehicleMaintenance): MaintenanceResponseDto {
    const dto: MaintenanceResponseDto = {
      id: maintenance.id,
      maintenance_type: maintenance.maintenance_type,
      title: maintenance.title,
      description: maintenance.description,
      maintenance_date: maintenance.maintenance_date,
      mileage_at_maintenance: maintenance.mileage_at_maintenance,
      status: maintenance.status,
      created_at: maintenance.created_at,
      updated_at: maintenance.updated_at,
    };

    // Add optional fields only if they exist
    if (maintenance.service_provider) {
      dto.service_provider = maintenance.service_provider;
    }
    if (maintenance.service_provider_contact) {
      dto.service_provider_contact = maintenance.service_provider_contact;
    }
    if (maintenance.service_location) {
      dto.service_location = maintenance.service_location;
    }
    if (maintenance.next_maintenance_date) {
      dto.next_maintenance_date = maintenance.next_maintenance_date;
    }
    if (maintenance.next_maintenance_mileage) {
      dto.next_maintenance_mileage = maintenance.next_maintenance_mileage;
    }
    if (maintenance.service_order_number) {
      dto.service_order_number = maintenance.service_order_number;
    }
    if (maintenance.warranty_period) {
      dto.warranty_period = maintenance.warranty_period;
    }
    if (maintenance.warranty_expiry_date) {
      dto.warranty_expiry_date = maintenance.warranty_expiry_date;
    }
    if (maintenance.parts_used) {
      dto.parts_used = maintenance.parts_used;
    }
    if (maintenance.services_performed) {
      dto.services_performed = maintenance.services_performed;
    }
    if (maintenance.notes) {
      dto.notes = maintenance.notes;
    }
    if (maintenance.start_date) {
      dto.start_date = maintenance.start_date;
    }
    if (maintenance.completion_date) {
      dto.completion_date = maintenance.completion_date;
    }
    if (maintenance.service_rating) {
      dto.service_rating = maintenance.service_rating;
    }
    if (maintenance.rating_comments) {
      dto.rating_comments = maintenance.rating_comments;
    }

    return dto;
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

  // Métodos para sistema de alertas

  async checkMaintenanceAlerts(): Promise<VehicleResponseDto[]> {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const vehicles = await this.vehicleRepository.find({
      where: {
        next_maintenance_at: LessThan(thirtyDaysFromNow),
        status: VehicleStatus.ACTIVE,
      },
      relations: ['documents', 'maintenances'],
      order: { next_maintenance_at: 'ASC' },
    });

    return vehicles.map(vehicle => this.mapToResponseDto(vehicle));
  }

  async checkDocumentAlerts(): Promise<VehicleResponseDto[]> {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const vehicles = await this.vehicleRepository.find({
      relations: ['documents'],
    });

    const vehiclesWithAlerts = vehicles.filter(vehicle => {
      if (!vehicle.documents || vehicle.documents.length === 0) {
        return false;
      }

      return vehicle.documents.some(document => {
        if (!document.expiry_date) {
          return false;
        }

        const expiryDate = new Date(document.expiry_date);
        return expiryDate <= thirtyDaysFromNow;
      });
    });

    return vehiclesWithAlerts.map(vehicle => this.mapToResponseDto(vehicle));
  }

  async getAlertsSummary(): Promise<AlertSummaryDto> {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Manutenções urgentes (próximos 7 dias)
    const urgentMaintenances = await this.vehicleRepository.count({
      where: {
        next_maintenance_at: LessThan(sevenDaysFromNow),
        status: VehicleStatus.ACTIVE,
      },
    });

    // Manutenções próximas (próximos 30 dias)
    const upcomingMaintenances = await this.vehicleRepository.count({
      where: {
        next_maintenance_at: Between(sevenDaysFromNow, thirtyDaysFromNow),
        status: VehicleStatus.ACTIVE,
      },
    });

    // Documentos expirando
    const vehiclesWithDocs = await this.vehicleRepository.find({
      relations: ['documents'],
    });

    let expiringDocuments = 0;
    let expiredDocuments = 0;
    let expiringInsurance = 0;
    let expiringLicenses = 0;

    for (const vehicle of vehiclesWithDocs) {
      if (vehicle.documents) {
        for (const document of vehicle.documents) {
          if (!document.expiry_date) {
            continue;
          }

          const expiryDate = new Date(document.expiry_date);

          if (expiryDate < now) {
            expiredDocuments++;
          } else if (expiryDate <= thirtyDaysFromNow) {
            expiringDocuments++;
          }

          // Check for insurance documents
          if (
            document.document_type === DocumentType.INSURANCE &&
            expiryDate <= thirtyDaysFromNow
          ) {
            expiringInsurance++;
          }

          // Check for license documents
          if (
            document.document_type === DocumentType.DRIVER_LICENSE &&
            expiryDate <= thirtyDaysFromNow
          ) {
            expiringLicenses++;
          }
        }
      }

      // Check vehicle insurance and license expiry
      if (
        vehicle.insurance_expiry_date &&
        new Date(vehicle.insurance_expiry_date) <= thirtyDaysFromNow
      ) {
        expiringInsurance++;
      }

      if (
        vehicle.license_expiry_date &&
        new Date(vehicle.license_expiry_date) <= thirtyDaysFromNow
      ) {
        expiringLicenses++;
      }
    }

    const totalVehiclesWithAlerts =
      urgentMaintenances + upcomingMaintenances + (expiringDocuments > 0 ? 1 : 0);

    // Determine severity level
    let severityLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    if (urgentMaintenances > 0 || expiredDocuments > 0) {
      severityLevel = 'high';
    } else if (upcomingMaintenances > 0 || expiringDocuments > 0) {
      severityLevel = 'medium';
    }

    if (urgentMaintenances > 3 || expiredDocuments > 5) {
      severityLevel = 'critical';
    }

    return {
      totalVehiclesWithAlerts,
      urgentMaintenances,
      upcomingMaintenances,
      expiringDocuments,
      expiredDocuments,
      expiringInsurance,
      expiringLicenses,
      severityLevel,
      lastChecked: now,
    };
  }
}
