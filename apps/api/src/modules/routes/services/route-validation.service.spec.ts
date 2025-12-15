import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { RouteValidationService } from './route-validation.service';
import { Route } from '../entities/route.entity';
import { Delivery } from '../../deliveries/entities/delivery.entity';
import { Driver } from '../../drivers/entities/driver.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { RouteStatus } from '../enums/route-status';
import { VehicleStatus } from '../../vehicles/enums/vehicle-status.enum';

describe('RouteValidationService', () => {
  let service: RouteValidationService;

  const mockRouteRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockDeliveryRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockDriverRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockVehicleRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RouteValidationService,
        {
          provide: getRepositoryToken(Route),
          useValue: mockRouteRepository,
        },
        {
          provide: getRepositoryToken(Delivery),
          useValue: mockDeliveryRepository,
        },
        {
          provide: getRepositoryToken(Driver),
          useValue: mockDriverRepository,
        },
        {
          provide: getRepositoryToken(Vehicle),
          useValue: mockVehicleRepository,
        },
      ],
    }).compile();

    service = module.get<RouteValidationService>(RouteValidationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateDriverAssignment', () => {
    const routeDate = new Date();

    it('deve lançar erro quando motorista não existe', async () => {
      mockDriverRepository.findOne.mockResolvedValue(null);

      await expect(
        service.validateDriverAssignment('non-existent-driver', routeDate),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar erro quando motorista está inativo', async () => {
      const driver = {
        id: 'driver-1',
        is_active: false,
        full_name: 'João Silva',
      };
      mockDriverRepository.findOne.mockResolvedValue(driver);

      await expect(service.validateDriverAssignment('driver-1', routeDate)).rejects.toThrow(
        'Motorista driver-1 está inativo',
      );
    });

    it('deve lançar erro quando motorista já tem rota em execução no dia', async () => {
      const driver = {
        id: 'driver-1',
        is_active: true,
        full_name: 'João Silva',
      };
      const existingRoute = {
        id: 'route-1',
        driver_id: 'driver-1',
        route_date: routeDate,
        status: RouteStatus.IN_PROGRESS,
      };

      mockDriverRepository.findOne.mockResolvedValue(driver);
      mockRouteRepository.find.mockResolvedValue([existingRoute]);

      await expect(service.validateDriverAssignment('driver-1', routeDate)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve passar quando motorista está disponível', async () => {
      const driver = {
        id: 'driver-1',
        is_active: true,
        full_name: 'João Silva',
      };

      mockDriverRepository.findOne.mockResolvedValue(driver);
      mockRouteRepository.find.mockResolvedValue([]);

      await expect(service.validateDriverAssignment('driver-1', routeDate)).resolves.not.toThrow();
    });
  });

  describe('validateVehicleAssignment', () => {
    const routeDate = new Date();

    it('deve lançar erro quando veículo não existe', async () => {
      mockVehicleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.validateVehicleAssignment('non-existent-vehicle', routeDate),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar erro quando veículo está em manutenção', async () => {
      const vehicle = {
        id: 'vehicle-1',
        status: VehicleStatus.MAINTENANCE,
        license_plate: 'ABC-1234',
      };
      mockVehicleRepository.findOne.mockResolvedValue(vehicle);

      await expect(service.validateVehicleAssignment('vehicle-1', routeDate)).rejects.toThrow(
        'Veículo vehicle-1 não está disponível',
      );
    });

    it('deve lançar erro quando veículo está fora de serviço', async () => {
      const vehicle = {
        id: 'vehicle-1',
        status: VehicleStatus.OUT_OF_SERVICE,
        license_plate: 'ABC-1234',
      };
      mockVehicleRepository.findOne.mockResolvedValue(vehicle);

      await expect(service.validateVehicleAssignment('vehicle-1', routeDate)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve passar quando veículo está ativo e disponível', async () => {
      const vehicle = {
        id: 'vehicle-1',
        status: VehicleStatus.ACTIVE,
        license_plate: 'ABC-1234',
      };

      mockVehicleRepository.findOne.mockResolvedValue(vehicle);
      mockRouteRepository.find.mockResolvedValue([]);

      await expect(
        service.validateVehicleAssignment('vehicle-1', routeDate),
      ).resolves.not.toThrow();
    });
  });

  describe('validateRouteCapacity', () => {
    it('deve lançar erro quando veículo não existe', async () => {
      mockVehicleRepository.findOne.mockResolvedValue(null);

      await expect(service.validateRouteCapacity('non-existent-vehicle', 100)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar erro quando peso excede capacidade do veículo', async () => {
      const vehicle = {
        id: 'vehicle-1',
        load_capacity: 1000,
        license_plate: 'ABC-1234',
      };

      mockVehicleRepository.findOne.mockResolvedValue(vehicle);

      await expect(service.validateRouteCapacity('vehicle-1', 1500)).rejects.toThrow(
        'Capacidade do veículo excedida',
      );
    });

    it('deve lançar erro quando volume excede capacidade do veículo', async () => {
      const vehicle = {
        id: 'vehicle-1',
        load_capacity: 2000,
        cargo_volume: 10,
        license_plate: 'ABC-1234',
      };

      mockVehicleRepository.findOne.mockResolvedValue(vehicle);

      await expect(service.validateRouteCapacity('vehicle-1', 500, 15)).rejects.toThrow(
        'Volume do veículo excedido',
      );
    });

    it('deve passar quando carga está dentro da capacidade', async () => {
      const vehicle = {
        id: 'vehicle-1',
        load_capacity: 1000,
        cargo_volume: 20,
        license_plate: 'ABC-1234',
      };

      mockVehicleRepository.findOne.mockResolvedValue(vehicle);

      await expect(service.validateRouteCapacity('vehicle-1', 800, 15)).resolves.not.toThrow();
    });

    it('deve passar quando não há limites definidos', async () => {
      const vehicle = {
        id: 'vehicle-1',
        license_plate: 'ABC-1234',
      };

      mockVehicleRepository.findOne.mockResolvedValue(vehicle);

      await expect(service.validateRouteCapacity('vehicle-1')).resolves.not.toThrow();
    });
  });

  describe('validateStatusTransition', () => {
    it('deve permitir transição de PLANNED para IN_PROGRESS com motorista atribuído', async () => {
      const route = {
        id: 'route-1',
        status: RouteStatus.PLANNED,
        driver_id: 'driver-1',
        stops: [],
      };

      mockRouteRepository.findOne.mockResolvedValue(route);

      await expect(
        service.validateStatusTransition('route-1', RouteStatus.IN_PROGRESS),
      ).resolves.not.toThrow();
    });

    it('deve lançar erro na transição de PLANNED para IN_PROGRESS sem motorista', async () => {
      const route = {
        id: 'route-1',
        status: RouteStatus.PLANNED,
        driver_id: null,
        stops: [],
      };

      mockRouteRepository.findOne.mockResolvedValue(route);

      await expect(
        service.validateStatusTransition('route-1', RouteStatus.IN_PROGRESS),
      ).rejects.toThrow('Motorista não atribuído à rota');
    });

    it('deve permitir transição de IN_PROGRESS para COMPLETED quando todas as paradas estão completas', async () => {
      const route = {
        id: 'route-1',
        status: RouteStatus.IN_PROGRESS,
        stops: [
          { id: 'stop-1', status: 'COMPLETED' },
          { id: 'stop-2', status: 'SKIPPED' },
          { id: 'stop-3', status: 'FAILED' },
        ],
      };

      mockRouteRepository.findOne.mockResolvedValue(route);

      await expect(
        service.validateStatusTransition('route-1', RouteStatus.COMPLETED),
      ).resolves.not.toThrow();
    });

    it('deve lançar erro na transição para COMPLETED com paradas pendentes', async () => {
      const route = {
        id: 'route-1',
        status: RouteStatus.IN_PROGRESS,
        stops: [
          { id: 'stop-1', status: 'COMPLETED' },
          { id: 'stop-2', status: 'PENDING' },
        ],
      };

      mockRouteRepository.findOne.mockResolvedValue(route);

      await expect(
        service.validateStatusTransition('route-1', RouteStatus.COMPLETED),
      ).rejects.toThrow('COMPLETED, SKIPPED ou FAILED');
    });

    it('deve sempre permitir transição para CANCELLED', async () => {
      const route = {
        id: 'route-1',
        status: RouteStatus.IN_PROGRESS,
        stops: [],
      };

      mockRouteRepository.findOne.mockResolvedValue(route);

      await expect(
        service.validateStatusTransition('route-1', RouteStatus.CANCELLED),
      ).resolves.not.toThrow();
    });

    it('deve lançar erro para transição inválida COMPLETED para PLANNED', async () => {
      const route = {
        id: 'route-1',
        status: RouteStatus.COMPLETED,
        stops: [],
      };

      mockRouteRepository.findOne.mockResolvedValue(route);

      await expect(
        service.validateStatusTransition('route-1', RouteStatus.PLANNED),
      ).rejects.toThrow('Transição de status não suportada');
    });

    it('deve lançar erro quando rota não existe', async () => {
      mockRouteRepository.findOne.mockResolvedValue(null);

      await expect(
        service.validateStatusTransition('non-existent-route', RouteStatus.IN_PROGRESS),
      ).rejects.toThrow('Rota com ID non-existent-route não encontrada');
    });
  });

  describe('findAvailableDriverAndVehicle', () => {
    it('deve lançar erro quando rota não existe', async () => {
      mockRouteRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findAvailableDriverAndVehicle('non-existent-route', new Date()),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar erro quando não há motoristas disponíveis', async () => {
      const route = {
        id: 'route-1',
        stops: [{ id: 'stop-1' }, { id: 'stop-2' }],
      };

      mockRouteRepository.findOne.mockResolvedValue(route);

      const mockDriverQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockDriverRepository.createQueryBuilder.mockReturnValue(mockDriverQueryBuilder);

      await expect(service.findAvailableDriverAndVehicle('route-1', new Date())).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar erro quando não há veículos disponíveis', async () => {
      const route = {
        id: 'route-1',
        stops: [{ id: 'stop-1' }, { id: 'stop-2' }],
      };

      const driver = {
        id: 'driver-1',
        status: 'ACTIVE',
        full_name: 'João Silva',
      };

      mockRouteRepository.findOne.mockResolvedValue(route);

      const mockDriverQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([driver]),
      };

      const mockVehicleQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockDriverRepository.createQueryBuilder.mockReturnValue(mockDriverQueryBuilder);
      mockVehicleRepository.createQueryBuilder.mockReturnValue(mockVehicleQueryBuilder);

      await expect(service.findAvailableDriverAndVehicle('route-1', new Date())).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve retornar motorista e veículo disponíveis', async () => {
      const route = {
        id: 'route-1',
        stops: [{ id: 'stop-1' }, { id: 'stop-2' }],
      };

      const driver = {
        id: 'driver-1',
        status: 'ACTIVE',
        full_name: 'João Silva',
      };

      const vehicle = {
        id: 'vehicle-1',
        status: VehicleStatus.ACTIVE,
        load_capacity: 1000,
        license_plate: 'ABC-1234',
        mileage: 10000,
      };

      mockRouteRepository.findOne.mockResolvedValue(route);

      const mockDriverQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([driver]),
      };

      const mockVehicleQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([vehicle]),
      };

      mockDriverRepository.createQueryBuilder.mockReturnValue(mockDriverQueryBuilder);
      mockVehicleRepository.createQueryBuilder.mockReturnValue(mockVehicleQueryBuilder);

      const result = await service.findAvailableDriverAndVehicle('route-1', new Date());

      expect(result.driver_id).toBe('driver-1');
      expect(result.driver_name).toBe('João Silva');
      expect(result.vehicle_id).toBe('vehicle-1');
      expect(result.vehicle_plate).toBe('ABC-1234');
      expect(result.assignment_reason).toBeDefined();
      expect(result.confidence_score).toBeDefined();
    });
  });

  describe('validateRouteDates', () => {
    it('deve lançar erro quando data planejada é no passado', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      expect(() => service.validateRouteDates(pastDate)).toThrow(
        'Data planejada não pode ser no passado',
      );
    });

    it('deve lançar erro quando horário de início é após horário de término', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      expect(() => service.validateRouteDates(futureDate, '14:00', '10:00')).toThrow(
        'Horário de início 14:00 deve ser anterior ao horário de término 10:00',
      );
    });

    it('deve passar quando datas e horários são válidos', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      expect(() => service.validateRouteDates(futureDate, '08:00', '18:00')).not.toThrow();
    });
  });
});
