import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { RouteOptimizationService } from './route-optimization.service';
import { Route } from '../entities/route.entity';
import { RouteStop } from '../entities/route_stop.entity';
import { Delivery } from '../../deliveries/entities/delivery.entity';
import { RouteStatus } from '../enums/route-status';
import { DistanceCalculatorService } from '@nexus/common';

describe('RouteOptimizationService', () => {
  let service: RouteOptimizationService;

  const mockRouteRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockRouteStopRepository = {
    find: jest.fn(),
    save: jest.fn(),
  };

  const mockDeliveryRepository = {
    find: jest.fn(),
  };

  const mockDistanceCalculator = {
    parseCoordinates: jest.fn(),
    calculateDistance: jest.fn(),
    calculateEstimatedDuration: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RouteOptimizationService,
        {
          provide: getRepositoryToken(Route),
          useValue: mockRouteRepository,
        },
        {
          provide: getRepositoryToken(RouteStop),
          useValue: mockRouteStopRepository,
        },
        {
          provide: getRepositoryToken(Delivery),
          useValue: mockDeliveryRepository,
        },
        {
          provide: DistanceCalculatorService,
          useValue: mockDistanceCalculator,
        },
      ],
    }).compile();

    service = module.get<RouteOptimizationService>(RouteOptimizationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('optimizeRoute', () => {
    it('deve lançar NotFoundException quando rota não existe', async () => {
      mockRouteRepository.findOne.mockResolvedValue(null);

      await expect(service.optimizeRoute('non-existent-id')).rejects.toThrow(
        'Rota com ID non-existent-id não encontrada',
      );
    });

    it('deve retornar resultado vazio para rota em status COMPLETED', async () => {
      const route = {
        id: 'route-1',
        status: RouteStatus.COMPLETED,
        stops: [],
      };
      mockRouteRepository.findOne.mockResolvedValue(route);

      const result = await service.optimizeRoute('route-1');

      expect(result.algorithm_used).toBe('NONE');
      expect(result.optimized_route).toHaveLength(0);
    });

    it('deve otimizar rota planejada com paradas', async () => {
      const stops = [
        {
          id: 'stop-1',
          coordinates: 'POINT(-46.6500 -23.5600)',
          sequence_order: 1,
          status: 'PENDING',
        },
      ];

      const route = {
        id: 'route-1',
        status: RouteStatus.PLANNED,
        stops,
        start_location: 'POINT(-46.6333 -23.5505)',
        type: 'DELIVERY',
      };

      mockRouteRepository.findOne.mockResolvedValue(route);
      mockRouteRepository.save.mockResolvedValue(route);
      mockDistanceCalculator.parseCoordinates.mockImplementation((point: string) => {
        const match = /POINT\(([-\d.]+) ([-\d.]+)\)/.exec(point);
        if (match) {
          return { longitude: parseFloat(match[1]), latitude: parseFloat(match[2]) };
        }
        return { latitude: 0, longitude: 0 };
      });
      mockDistanceCalculator.calculateDistance.mockReturnValue(5);
      mockDistanceCalculator.calculateEstimatedDuration.mockReturnValue(15);

      const result = await service.optimizeRoute('route-1');

      expect(result).toBeDefined();
      expect(result.optimized_route).toHaveLength(1);
      expect(result.algorithm_used).toBe('NEAREST_NEIGHBOR');
    });
  });

  describe('suggestOptimizedRoutes', () => {
    it('deve retornar array vazio quando não há entregas pendentes', async () => {
      mockDeliveryRepository.find.mockResolvedValue([]);

      const result = await service.suggestOptimizedRoutes();

      expect(result).toEqual([]);
    });

    it('deve agrupar entregas pendentes por região e criar sugestões de rotas otimizadas', async () => {
      const mockDeliveries = [
        {
          id: 'delivery-1',
          delivery_address: {
            latitude: -23.56,
            longitude: -46.65,
          },
          status: 'PENDING',
        },
        {
          id: 'delivery-2',
          delivery_address: {
            latitude: -23.562,
            longitude: -46.652,
          },
          status: 'PENDING',
        },
      ];

      mockDeliveryRepository.find.mockResolvedValue(mockDeliveries);
      mockDistanceCalculator.parseCoordinates.mockImplementation((point: string) => {
        const match = /POINT\(([-\d.]+) ([-\d.]+)\)/.exec(point);
        if (match) {
          return { longitude: parseFloat(match[1]), latitude: parseFloat(match[2]) };
        }
        return { latitude: 0, longitude: 0 };
      });

      const result = await service.suggestOptimizedRoutes();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
