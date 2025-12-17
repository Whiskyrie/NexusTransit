import { Test, type TestingModule } from '@nestjs/testing';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { VehicleStatus, VehicleType, FuelType, LicensePlateType } from './enums';

describe('VehiclesController', () => {
  let controller: VehiclesController;
  let service: VehiclesService;

  const mockVehiclesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    replace: jest.fn(),
    remove: jest.fn(),
    uploadDocuments: jest.fn(),
    getDocuments: jest.fn(),
    updateDocument: jest.fn(),
    removeDocument: jest.fn(),
    getExpiringDocuments: jest.fn(),
    getExpiredDocuments: jest.fn(),
    createMaintenance: jest.fn(),
    getMaintenances: jest.fn(),
    updateMaintenance: jest.fn(),
    completeMaintenance: jest.fn(),
    cancelMaintenance: jest.fn(),
    getScheduledMaintenances: jest.fn(),
    getOverdueMaintenances: jest.fn(),
    checkMaintenanceAlerts: jest.fn(),
    checkDocumentAlerts: jest.fn(),
    getAlertsSummary: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [
        {
          provide: VehiclesService,
          useValue: mockVehiclesService,
        },
      ],
    }).compile();

    controller = module.get<VehiclesController>(VehiclesController);
    service = module.get<VehiclesService>(VehiclesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
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

    it('deve criar um veículo', async () => {
      const mockResponse = {
        id: 'vehicle-123',
        ...createVehicleDto,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockVehiclesService.create.mockResolvedValue(mockResponse);

      const result = await controller.create(createVehicleDto);

      expect(result).toEqual(mockResponse);
      expect(service.create).toHaveBeenCalledWith(createVehicleDto);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de veículos', async () => {
      const mockResponse = {
        data: [
          {
            id: 'vehicle-1',
            license_plate: 'ABC1234',
            brand: 'Volkswagen',
            model: 'Delivery',
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          total_pages: 1,
          has_previous: false,
          has_next: false,
        },
      };

      mockVehiclesService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll({ page: 1, limit: 10 });

      expect(result).toEqual(mockResponse);
      expect(service.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });

  describe('findOne', () => {
    it('deve retornar um veículo por ID', async () => {
      const mockResponse = {
        id: 'vehicle-123',
        license_plate: 'ABC1234',
        brand: 'Volkswagen',
        model: 'Delivery',
      };

      mockVehiclesService.findOne.mockResolvedValue(mockResponse);

      const result = await controller.findOne('vehicle-123');

      expect(result).toEqual(mockResponse);
      expect(service.findOne).toHaveBeenCalledWith('vehicle-123');
    });
  });

  describe('update', () => {
    it('deve atualizar um veículo', async () => {
      const updateDto = { brand: 'Mercedes', model: 'Sprinter' };
      const mockResponse = {
        id: 'vehicle-123',
        ...updateDto,
        license_plate: 'ABC1234',
      };

      mockVehiclesService.update.mockResolvedValue(mockResponse);

      const result = await controller.update('vehicle-123', updateDto);

      expect(result).toEqual(mockResponse);
      expect(service.update).toHaveBeenCalledWith('vehicle-123', updateDto);
    });
  });

  describe('remove', () => {
    it('deve remover um veículo', async () => {
      mockVehiclesService.remove.mockResolvedValue(undefined);

      await controller.remove('vehicle-123');

      expect(service.remove).toHaveBeenCalledWith('vehicle-123');
    });
  });

  describe('uploadDocuments', () => {
    it('deve fazer upload de documentos', async () => {
      const mockFiles = [
        {
          originalname: 'crlv.pdf',
          mimetype: 'application/pdf',
          size: 1024,
          buffer: Buffer.from('test'),
        },
      ] as Express.Multer.File[];

      const uploadDto = {
        document_type: 'crlv' as any,
        expiry_date: '2024-12-31',
      };

      const mockResponse = [
        {
          id: 'doc-123',
          original_name: 'crlv.pdf',
          file_path: 'vehicles/documents/abc.pdf',
        },
      ];

      mockVehiclesService.uploadDocuments.mockResolvedValue(mockResponse);

      const result = await controller.uploadDocuments('vehicle-123', mockFiles, uploadDto);

      expect(result).toEqual(mockResponse);
      expect(service.uploadDocuments).toHaveBeenCalledWith('vehicle-123', mockFiles, uploadDto);
    });
  });

  describe('getMaintenances', () => {
    it('deve retornar manutenções de um veículo', async () => {
      const mockResponse = [
        {
          id: 'maintenance-123',
          vehicle_id: 'vehicle-123',
          maintenance_type: 'preventive',
          description: 'Troca de óleo',
        },
      ];

      mockVehiclesService.getMaintenances.mockResolvedValue(mockResponse);

      const result = await controller.getMaintenances('vehicle-123');

      expect(result).toEqual(mockResponse);
      expect(service.getMaintenances).toHaveBeenCalledWith('vehicle-123');
    });
  });

  describe('createMaintenance', () => {
    it('deve criar uma manutenção', async () => {
      const createDto = {
        maintenance_type: 'preventive' as any,
        title: 'Revisão dos 10.000 km',
        description: 'Troca de óleo',
        maintenance_date: '2024-12-20',
        mileage_at_maintenance: 10000,
      };

      const mockResponse = {
        id: 'maintenance-123',
        vehicle_id: 'vehicle-123',
        ...createDto,
      };

      mockVehiclesService.createMaintenance.mockResolvedValue(mockResponse);

      const result = await controller.createMaintenance('vehicle-123', createDto);

      expect(result).toEqual(mockResponse);
      expect(service.createMaintenance).toHaveBeenCalledWith('vehicle-123', createDto);
    });
  });

  describe('completeMaintenance', () => {
    it('deve completar uma manutenção', async () => {
      const completeDto = {
        completed_date: new Date(),
        actual_cost: 600,
        odometer_reading: 50000,
        service_rating: 5,
      };

      const mockResponse = {
        id: 'maintenance-123',
        vehicle_id: 'vehicle-123',
        status: 'completed',
      };

      mockVehiclesService.completeMaintenance.mockResolvedValue(mockResponse);

      const result = await controller.completeMaintenance(
        'vehicle-123',
        'maintenance-123',
        completeDto,
      );

      expect(result).toEqual(mockResponse);
      expect(service.completeMaintenance).toHaveBeenCalledWith(
        'vehicle-123',
        'maintenance-123',
        completeDto,
      );
    });
  });

  describe('getAlertsSummary', () => {
    it('deve retornar resumo de alertas', async () => {
      const mockResponse = {
        totalVehiclesWithAlerts: 5,
        urgentMaintenances: 2,
        upcomingMaintenances: 3,
        expiringDocuments: 4,
        expiredDocuments: 1,
        expiringInsurance: 2,
        expiringLicenses: 2,
        severityLevel: 'high' as const,
        lastChecked: new Date(),
      };

      mockVehiclesService.getAlertsSummary.mockResolvedValue(mockResponse);

      const result = await controller.getAlertsSummary();

      expect(result).toEqual(mockResponse);
      expect(service.getAlertsSummary).toHaveBeenCalled();
    });
  });

  describe('checkMaintenanceAlerts', () => {
    it('deve retornar alertas de manutenção', async () => {
      const mockResponse = [
        {
          id: 'vehicle-123',
          license_plate: 'ABC1234',
        },
      ];

      mockVehiclesService.checkMaintenanceAlerts.mockResolvedValue(mockResponse);

      const result = await controller.checkMaintenanceAlerts();

      expect(result).toEqual(mockResponse);
      expect(service.checkMaintenanceAlerts).toHaveBeenCalled();
    });
  });

  describe('checkDocumentAlerts', () => {
    it('deve retornar alertas de documentos', async () => {
      const mockResponse = [
        {
          id: 'vehicle-123',
          license_plate: 'ABC1234',
        },
      ];

      mockVehiclesService.checkDocumentAlerts.mockResolvedValue(mockResponse);

      const result = await controller.checkDocumentAlerts();

      expect(result).toEqual(mockResponse);
      expect(service.checkDocumentAlerts).toHaveBeenCalled();
    });
  });
});
