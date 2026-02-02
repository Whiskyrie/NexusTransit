import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from './entities/vehicle.entity';
import { VehicleDocument } from './entities/vehicle-document.entity';
import { VehicleMaintenance } from './entities/vehicle-maintenance.entity';
import { StorageService } from '@nexus/storage';
import {
  VehicleStatus,
  VehicleType,
  FuelType,
  MaintenanceStatus,
  MaintenanceType,
  LicensePlateType,
} from './enums';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let module: TestingModule;

  const mockVehicleRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    softRemove: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockDocumentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    softRemove: jest.fn(),
  };

  const mockMaintenanceRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    softRemove: jest.fn(),
  };

  const mockStorageService = {
    uploadFile: jest.fn(),
    uploadMultipleFiles: jest.fn(),
    deleteImage: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        VehiclesService,
        {
          provide: getRepositoryToken(Vehicle),
          useValue: mockVehicleRepository,
        },
        {
          provide: getRepositoryToken(VehicleDocument),
          useValue: mockDocumentRepository,
        },
        {
          provide: getRepositoryToken(VehicleMaintenance),
          useValue: mockMaintenanceRepository,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('create', () => {
    const createVehicleDto = {
      license_plate: 'ABC1234',
      brand: 'Volkswagen',
      model: 'Delivery',
      year: 2023,
      vehicle_type: VehicleType.TRUCK,
      fuel_type: FuelType.DIESEL,
      status: VehicleStatus.ACTIVE,
      mileage: 0,
      has_gps: true,
      has_refrigeration: false,
      license_plate_type: LicensePlateType.OLD_FORMAT,
    };

    it('deve criar um veículo com sucesso', async () => {
      const mockVehicle = {
        id: 'vehicle-123',
        ...createVehicleDto,
        license_plate: 'ABC1234',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockVehicleRepository.findOne.mockResolvedValue(null);
      mockVehicleRepository.create.mockReturnValue(mockVehicle);
      mockVehicleRepository.save.mockResolvedValue(mockVehicle);

      const result = await service.create(createVehicleDto);

      expect(result).toBeDefined();
      expect(result.license_plate).toBe('ABC1234');
      expect(mockVehicleRepository.findOne).toHaveBeenCalledWith({
        where: { license_plate: 'ABC1234' },
      });
      expect(mockVehicleRepository.save).toHaveBeenCalled();
    });

    it('deve lançar BadRequestException se placa já existe', async () => {
      const existingVehicle = { id: 'vehicle-456', license_plate: 'ABC1234' };
      mockVehicleRepository.findOne.mockResolvedValue(existingVehicle);

      await expect(service.create(createVehicleDto)).rejects.toThrow(BadRequestException);
      expect(mockVehicleRepository.save).not.toHaveBeenCalled();
    });

    it('deve normalizar a placa do veículo', async () => {
      const dtoWithUnnormalizedPlate = {
        ...createVehicleDto,
        license_plate: 'abc-1234',
      };

      const mockVehicle = {
        id: 'vehicle-789',
        ...dtoWithUnnormalizedPlate,
        license_plate: 'ABC1234',
      };

      mockVehicleRepository.findOne.mockResolvedValue(null);
      mockVehicleRepository.create.mockReturnValue(mockVehicle);
      mockVehicleRepository.save.mockResolvedValue(mockVehicle);

      const result = await service.create(dtoWithUnnormalizedPlate);

      expect(result.license_plate).toBe('ABC1234');
    });
  });

  describe('findAll', () => {
    it('deve retornar lista paginada de veículos', async () => {
      const mockVehicles = [
        {
          id: 'vehicle-1',
          license_plate: 'ABC1234',
          brand: 'Volkswagen',
          model: 'Delivery',
        },
        {
          id: 'vehicle-2',
          license_plate: 'DEF5678',
          brand: 'Mercedes',
          model: 'Sprinter',
        },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockVehicles, 2]),
      };

      mockVehicleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(mockVehicleRepository.createQueryBuilder).toHaveBeenCalled();
    });

    it('deve filtrar veículos por status', async () => {
      const mockVehicles = [
        {
          id: 'vehicle-1',
          status: VehicleStatus.ACTIVE,
        },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockVehicles, 1]),
      };

      mockVehicleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        status: VehicleStatus.ACTIVE,
      });

      expect(result.data).toHaveLength(1);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('deve retornar um veículo por ID', async () => {
      const mockVehicle = {
        id: 'vehicle-123',
        license_plate: 'ABC1234',
        brand: 'Volkswagen',
      };

      mockVehicleRepository.findOne.mockResolvedValue(mockVehicle);

      const result = await service.findOne('vehicle-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('vehicle-123');
      expect(mockVehicleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'vehicle-123' },
        relations: expect.any(Array),
      });
    });

    it('deve lançar NotFoundException se veículo não existe', async () => {
      mockVehicleRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('vehicle-999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const mockVehicle = {
      id: 'vehicle-123',
      license_plate: 'ABC1234',
      brand: 'Volkswagen',
      model: 'Delivery',
      status: VehicleStatus.ACTIVE,
    };

    it('deve atualizar um veículo com sucesso', async () => {
      const updateDto = { brand: 'Mercedes', model: 'Sprinter' };
      const updatedVehicle = { ...mockVehicle, ...updateDto };

      mockVehicleRepository.findOne.mockResolvedValue(mockVehicle);
      mockVehicleRepository.save.mockResolvedValue(updatedVehicle);

      const result = await service.update('vehicle-123', updateDto);

      expect(result.brand).toBe('Mercedes');
      expect(result.model).toBe('Sprinter');
      expect(mockVehicleRepository.save).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se veículo não existe', async () => {
      mockVehicleRepository.findOne.mockResolvedValue(null);

      await expect(service.update('vehicle-999', { brand: 'Mercedes' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('deve remover um veículo com sucesso', async () => {
      const mockVehicle = {
        id: 'vehicle-123',
        license_plate: 'ABC1234',
      };

      mockVehicleRepository.findOne.mockResolvedValue(mockVehicle);
      mockVehicleRepository.softRemove.mockResolvedValue(mockVehicle);

      await service.remove('vehicle-123');

      expect(mockVehicleRepository.softRemove).toHaveBeenCalledWith(mockVehicle);
    });

    it('deve lançar NotFoundException se veículo não existe', async () => {
      mockVehicleRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('vehicle-999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createMaintenance', () => {
    const createMaintenanceDto = {
      maintenance_type: MaintenanceType.PREVENTIVE,
      title: 'Revisão dos 10.000 km',
      description: 'Troca de óleo',
      maintenance_date: '2024-12-20',
      mileage_at_maintenance: 10000,
    };

    it('deve criar uma manutenção com sucesso', async () => {
      const mockVehicle = {
        id: 'vehicle-123',
        license_plate: 'ABC1234',
      };

      const mockMaintenance = {
        id: 'maintenance-123',
        vehicle_id: 'vehicle-123',
        ...createMaintenanceDto,
        status: MaintenanceStatus.SCHEDULED,
      };

      mockVehicleRepository.findOne.mockResolvedValue(mockVehicle);
      mockMaintenanceRepository.create.mockReturnValue(mockMaintenance);
      mockMaintenanceRepository.save.mockResolvedValue(mockMaintenance);

      const result = await service.createMaintenance('vehicle-123', createMaintenanceDto);

      expect(result).toBeDefined();
      expect(result.maintenance_type).toBe(MaintenanceType.PREVENTIVE);
      expect(result.status).toBe(MaintenanceStatus.SCHEDULED);
      expect(mockMaintenanceRepository.save).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se veículo não existe', async () => {
      mockVehicleRepository.findOne.mockResolvedValue(null);

      await expect(service.createMaintenance('vehicle-999', createMaintenanceDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('completeMaintenance', () => {
    const completeDto = {
      service_rating: 5,
      rating_comments: 'Excelente serviço',
    };

    it('deve completar uma manutenção com sucesso', async () => {
      const mockMaintenance = {
        id: 'maintenance-123',
        vehicle_id: 'vehicle-123',
        status: MaintenanceStatus.IN_PROGRESS,
      };

      const completedMaintenance = {
        ...mockMaintenance,
        ...completeDto,
        status: MaintenanceStatus.COMPLETED,
      };

      mockVehicleRepository.findOne.mockResolvedValue({ id: 'vehicle-123' });
      mockMaintenanceRepository.findOne.mockResolvedValue(mockMaintenance);
      mockMaintenanceRepository.save.mockResolvedValue(completedMaintenance);

      const result = await service.completeMaintenance(
        'vehicle-123',
        'maintenance-123',
        completeDto,
      );

      expect(result.status).toBe(MaintenanceStatus.COMPLETED);
      expect(result.service_rating).toBe(5);
      expect(mockMaintenanceRepository.save).toHaveBeenCalled();
    });

    it('deve lançar BadRequestException se manutenção já está completa', async () => {
      const mockMaintenance = {
        id: 'maintenance-123',
        vehicle_id: 'vehicle-123',
        status: MaintenanceStatus.COMPLETED,
      };

      mockVehicleRepository.findOne.mockResolvedValue({ id: 'vehicle-123' });
      mockMaintenanceRepository.findOne.mockResolvedValue(mockMaintenance);

      await expect(
        service.completeMaintenance('vehicle-123', 'maintenance-123', completeDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAlertsSummary', () => {
    it('deve retornar resumo de alertas', async () => {
      const mockVehiclesWithAlerts = [
        {
          id: 'vehicle-1',
          license_plate: 'ABC1234',
          insurance_expiry_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days
          license_expiry_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days
          documents: [
            {
              id: 'doc-1',
              document_type: 'INSURANCE',
              expiry_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
            },
          ],
        },
      ];

      const mockMaintenances = [
        {
          id: 'maintenance-1',
          vehicle_id: 'vehicle-1',
          scheduled_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          status: MaintenanceStatus.SCHEDULED,
        },
      ];

      // Mock count para urgentMaintenances e upcomingMaintenances
      mockVehicleRepository.count.mockResolvedValueOnce(2); // urgentMaintenances
      mockVehicleRepository.count.mockResolvedValueOnce(3); // upcomingMaintenances
      mockVehicleRepository.find.mockResolvedValue(mockVehiclesWithAlerts);
      mockMaintenanceRepository.find.mockResolvedValue(mockMaintenances);

      const result = await service.getAlertsSummary();

      expect(result).toBeDefined();
      expect(result.totalVehiclesWithAlerts).toBeGreaterThan(0);
      expect(result.urgentMaintenances).toBe(2);
      expect(result.upcomingMaintenances).toBe(3);
      expect(result.severityLevel).toBeDefined();
      expect(['low', 'medium', 'high', 'critical']).toContain(result.severityLevel);
    });
  });
});
