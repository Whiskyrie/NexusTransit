import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager, type SelectQueryBuilder } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { Route } from './entities/route.entity';
import { RouteStop } from './entities/route_stop.entity';
import { RouteHistory } from './entities/route_history.entity';
import { RouteStatus } from './enums/route-status';
import { AuditService } from '@nexus/audit';
import { RouteValidatorService } from './validators/route.validator';
import { DistanceCalculatorService } from '@nexus/common';
import { VehiclesService } from '../vehicles/vehicles.service';
import { DriversService } from '../drivers/drivers.service';
import { GoogleMapsService } from '@nexus/geo-services';

describe('RoutesService - Delivery Management', () => {
  let service: RoutesService;
  let module: TestingModule;

  const mockRoute: Partial<Route> = {
    id: 'route-1',
    status: RouteStatus.PLANNED,
    vehicle_id: 'vehicle-1',
    driver_id: 'driver-1',
  };

  const mockRouteStop: Partial<RouteStop> = {
    id: 'stop-1',
    route_id: 'route-1',
    customer_address_id: 'address-1',
    delivery_id: 'delivery-1',
    sequence_order: 1,
    status: 'PENDING',
  };

  // Factory para criar novo QueryBuilder a cada chamada
  const createMockQueryBuilder = () => {
    const qb = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(undefined),
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ max: 2 }),
      getOne: jest.fn().mockResolvedValue(null),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    return qb as unknown as SelectQueryBuilder<any>;
  };

  const mockRouteRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    softRemove: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
  };

  const mockRouteStopRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softRemove: jest.fn(),
    createQueryBuilder: jest.fn(() => createMockQueryBuilder()),
  };

  const mockRouteHistoryRepository = {
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockRouteValidatorService = {
    validateRouteData: jest.fn(),
    canUpdateRoute: jest.fn().mockReturnValue(true),
  };

  const mockDistanceCalculatorService = {
    calculateDistance: jest.fn().mockReturnValue(1000),
    calculateRouteDistance: jest.fn().mockReturnValue(5000),
  };

  const mockDeliveryRepository = {
    findOne: jest.fn().mockResolvedValue({
      id: 'delivery-1',
      customer_id: 'customer-1',
      status: 'PENDING',
    }),
  };

  const mockCustomerAddressRepository = {
    findOne: jest.fn().mockResolvedValue({
      id: 'address-1',
      customer_id: 'customer-1',
      full_address: 'Rua Teste, 123',
      coordinates: { lat: -23.5505, lng: -46.6333 },
    }),
  };

  const mockEntityManager = {
    getRepository: jest.fn((entityName: string) => {
      if (entityName === 'deliveries') {
        return mockDeliveryRepository;
      }
      if (entityName === 'customer_addresses') {
        return mockCustomerAddressRepository;
      }
      return mockRouteStopRepository;
    }),
    query: jest.fn(),
  };

  const mockAuditService = {
    createEntry: jest.fn(),
  };

  const mockVehiclesService = {
    findOne: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
    checkAvailability: jest.fn().mockResolvedValue(true),
  };

  const mockDriversService = {
    findOne: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
    checkAvailability: jest.fn().mockResolvedValue(true),
  };

  const mockGoogleMapsService = {
    calculateRoute: jest.fn().mockResolvedValue({ distance: 1000, duration: 600 }),
    geocode: jest.fn().mockResolvedValue({ lat: -23.5505, lng: -46.6333 }),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        RoutesService,
        {
          provide: getRepositoryToken(Route),
          useValue: mockRouteRepository,
        },
        {
          provide: getRepositoryToken(RouteStop),
          useValue: mockRouteStopRepository,
        },
        {
          provide: getRepositoryToken(RouteHistory),
          useValue: mockRouteHistoryRepository,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: RouteValidatorService,
          useValue: mockRouteValidatorService,
        },
        {
          provide: DistanceCalculatorService,
          useValue: mockDistanceCalculatorService,
        },
        {
          provide: VehiclesService,
          useValue: mockVehiclesService,
        },
        {
          provide: DriversService,
          useValue: mockDriversService,
        },
        {
          provide: GoogleMapsService,
          useValue: mockGoogleMapsService,
        },
      ],
    }).compile();

    service = module.get<RoutesService>(RoutesService);

    jest.clearAllMocks();
    // Restaurar o mock do createQueryBuilder após clearAllMocks
    mockRouteStopRepository.createQueryBuilder.mockImplementation(() => createMockQueryBuilder());
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('getRouteDeliveries', () => {
    it('deve listar entregas da rota em ordem', async () => {
      mockRouteRepository.findOne.mockResolvedValue(mockRoute);
      mockRouteStopRepository.find.mockResolvedValue([mockRouteStop]);

      const result = await service.getRouteDeliveries('route-1');

      expect(result).toEqual([mockRouteStop]);
      expect(mockRouteStopRepository.find).toHaveBeenCalledWith({
        where: { route_id: 'route-1' },
        order: { sequence_order: 'ASC' },
        relations: ['customer_address', 'customer_address.customer'],
      });
    });

    it('deve lançar erro se rota não existe', async () => {
      mockRouteRepository.findOne.mockResolvedValue(null);

      await expect(service.getRouteDeliveries('route-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addDeliveryToRoute', () => {
    it('deve adicionar entrega à rota', async () => {
      const routePlanned: Route = { ...mockRoute, status: RouteStatus.PLANNED } as Route;

      const mockDelivery = {
        id: 'delivery-1',
        customer_id: 'customer-1',
        customer_address_id: 'address-1',
        customer_address: {
          id: 'address-1',
          customer_id: 'customer-1',
          full_address: 'Rua Teste, 123',
          coordinates: null,
        },
      };

      const mockCustomerAddress = {
        id: 'address-1',
        customer_id: 'customer-1',
        full_address: 'Rua Teste, 123',
        coordinates: null,
      };

      const mockStop = {
        id: 'stop-1',
        route_id: 'route-1',
        customer_address_id: 'address-1',
        delivery_id: 'delivery-1',
        sequence_order: 1,
        status: 'PENDING',
      };

      mockRouteRepository.findOne.mockResolvedValue(routePlanned);
      mockEntityManager.getRepository.mockImplementation((entityName: string) => {
        if (entityName === 'deliveries') {
          return { findOne: jest.fn().mockResolvedValue(mockDelivery) };
        }
        if (entityName === 'customer_addresses') {
          return { findOne: jest.fn().mockResolvedValue(mockCustomerAddress) };
        }
        return mockRouteStopRepository;
      });

      mockRouteStopRepository.findOne.mockResolvedValue(null);
      mockRouteStopRepository.find.mockResolvedValue([mockStop]);
      mockRouteStopRepository.create.mockReturnValue(mockStop);
      mockRouteStopRepository.save.mockResolvedValue(mockStop);

      const result = await service.addDeliveryToRoute('route-1', 'delivery-1');

      expect(result).toEqual(mockStop);
      expect(mockRouteStopRepository.create).toHaveBeenCalled();
      expect(mockRouteStopRepository.save).toHaveBeenCalled();
    });

    it('deve lançar erro se rota não pode ser editada', async () => {
      const routeInProgress = { ...mockRoute, status: RouteStatus.IN_PROGRESS } as Route;
      mockRouteRepository.findOne.mockResolvedValue(routeInProgress);

      await expect(service.addDeliveryToRoute('route-1', 'delivery-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar erro se entrega já está em outra rota', async () => {
      const routePlanned = { ...mockRoute, status: RouteStatus.PLANNED } as Route;

      const mockDelivery = {
        id: 'delivery-1',
        customer_id: 'customer-1',
        customer_address_id: 'address-1',
        customer_address: {
          id: 'address-1',
          customer_id: 'customer-1',
          full_address: 'Rua Teste, 123',
          coordinates: null,
        },
      };

      const existingStop = { ...mockRouteStop };

      mockRouteRepository.findOne.mockResolvedValue(routePlanned);
      mockEntityManager.getRepository.mockImplementation((entityName: string) => {
        if (entityName === 'deliveries') {
          return { findOne: jest.fn().mockResolvedValue(mockDelivery) };
        }
        return mockRouteStopRepository;
      });
      mockRouteStopRepository.findOne.mockResolvedValue(existingStop);

      await expect(service.addDeliveryToRoute('route-1', 'delivery-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('removeDeliveryFromRoute', () => {
    it('deve remover entrega da rota', async () => {
      const routePlanned = { ...mockRoute, status: RouteStatus.PLANNED } as Route;
      const stopToRemove = { ...mockRouteStop, sequence_order: 2 };

      mockRouteRepository.findOne.mockResolvedValue(routePlanned);
      mockRouteStopRepository.findOne.mockResolvedValue(stopToRemove);
      mockRouteStopRepository.softRemove.mockResolvedValue(stopToRemove);
      mockRouteStopRepository.find.mockResolvedValue([]);

      await service.removeDeliveryFromRoute('route-1', 'delivery-1');

      expect(mockRouteStopRepository.softRemove).toHaveBeenCalledWith(stopToRemove);
      expect(mockRouteStopRepository.createQueryBuilder).toHaveBeenCalled();
    });

    it('deve lançar erro se rota não pode ser editada', async () => {
      const routeInProgress = { ...mockRoute, status: RouteStatus.IN_PROGRESS } as Route;
      mockRouteRepository.findOne.mockResolvedValue(routeInProgress);

      await expect(service.removeDeliveryFromRoute('route-1', 'delivery-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar erro se entrega não está na rota', async () => {
      const routePlanned = { ...mockRoute, status: RouteStatus.PLANNED } as Route;
      mockRouteRepository.findOne.mockResolvedValue(routePlanned);
      mockRouteStopRepository.findOne.mockResolvedValue(null);

      await expect(service.removeDeliveryFromRoute('route-1', 'delivery-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('reorderDeliveries', () => {
    it('deve reordenar entregas da rota', async () => {
      const routePlanned = { ...mockRoute, status: RouteStatus.PLANNED } as Route;
      const stops = [
        { id: 'stop-1', route_id: 'route-1', sequence_order: 1 },
        { id: 'stop-2', route_id: 'route-1', sequence_order: 2 },
      ];

      const reorderData = [
        { stop_id: 'stop-1', new_sequence: 2 },
        { stop_id: 'stop-2', new_sequence: 1 },
      ];

      mockRouteRepository.findOne.mockResolvedValue(routePlanned);
      mockRouteStopRepository.find
        .mockResolvedValueOnce(stops) // Primeira chamada - validação
        .mockResolvedValueOnce(stops) // Segunda chamada - updateRouteMetricsAfterChange
        .mockResolvedValueOnce([
          // Terceira chamada - retorno
          { ...stops[1], sequence_order: 1 },
          { ...stops[0], sequence_order: 2 },
        ]);
      mockRouteStopRepository.update.mockResolvedValue(undefined);

      const result = await service.reorderDeliveries('route-1', reorderData);

      expect(result).toHaveLength(2);
      expect(mockRouteStopRepository.update).toHaveBeenCalledTimes(2);
    });

    it('deve lançar erro se rota não pode ser editada', async () => {
      const routeInProgress = { ...mockRoute, status: RouteStatus.IN_PROGRESS } as Route;
      mockRouteRepository.findOne.mockResolvedValue(routeInProgress);

      const reorderData = [{ stop_id: 'stop-1', new_sequence: 1 }];

      await expect(service.reorderDeliveries('route-1', reorderData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar erro se parada não existe', async () => {
      const routePlanned = { ...mockRoute, status: RouteStatus.PLANNED } as Route;
      const stops = [{ id: 'stop-1', route_id: 'route-1', sequence_order: 1 }];

      mockRouteRepository.findOne.mockResolvedValue(routePlanned);
      mockRouteStopRepository.find.mockResolvedValue(stops);

      const reorderData = [{ stop_id: 'stop-999', new_sequence: 1 }];

      await expect(service.reorderDeliveries('route-1', reorderData)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar erro se há sequências duplicadas', async () => {
      const routePlanned = { ...mockRoute, status: RouteStatus.PLANNED } as Route;
      const stops = [
        { id: 'stop-1', route_id: 'route-1', sequence_order: 1 },
        { id: 'stop-2', route_id: 'route-1', sequence_order: 2 },
      ];

      mockRouteRepository.findOne.mockResolvedValue(routePlanned);
      mockRouteStopRepository.find.mockResolvedValue(stops);

      const reorderData = [
        { stop_id: 'stop-1', new_sequence: 1 },
        { stop_id: 'stop-2', new_sequence: 1 }, // Duplicada!
      ];

      await expect(service.reorderDeliveries('route-1', reorderData)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
