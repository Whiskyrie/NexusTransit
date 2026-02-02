import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RouteMetricsService } from './route-metrics.service';
import { Route } from '../entities/route.entity';
import { RouteStop } from '../entities/route_stop.entity';
import { RouteStatus } from '../enums/route-status';

describe('RouteMetricsService', () => {
  let service: RouteMetricsService;
  let module: TestingModule;

  const mockRouteRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockRouteStopRepository = {
    find: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        RouteMetricsService,
        {
          provide: getRepositoryToken(Route),
          useValue: mockRouteRepository,
        },
        {
          provide: getRepositoryToken(RouteStop),
          useValue: mockRouteStopRepository,
        },
      ],
    }).compile();

    service = module.get<RouteMetricsService>(RouteMetricsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (module) await module.close();
  });

  describe('calculateRouteMetrics', () => {
    it('deve lançar erro quando rota não existe', async () => {
      mockRouteRepository.findOne.mockResolvedValue(null);

      await expect(service.calculateRouteMetrics('non-existent-id')).rejects.toThrow(
        'Rota com ID non-existent-id não encontrada',
      );
    });

    it('deve calcular métricas corretamente para rota sem paradas', async () => {
      const route = {
        id: 'route-1',
        route_code: 'RT-20241214-001',
        status: RouteStatus.PLANNED,
        total_distance: 50,
        total_duration: 120,
        stops: [],
      };
      mockRouteRepository.findOne.mockResolvedValue(route);

      const result = await service.calculateRouteMetrics('route-1');

      expect(result.route_id).toBe('route-1');
      expect(result.route_code).toBe('RT-20241214-001');
      expect(result.total_stops).toBe(0);
      expect(result.completed_stops).toBe(0);
      expect(result.completion_percentage).toBe(0);
      expect(result.efficiency_score).toBeDefined();
    });

    it('deve calcular métricas corretamente para rota com paradas mistas', async () => {
      const stops = [
        { id: 'stop-1', status: 'COMPLETED', actual_stop_duration_minutes: 10 },
        { id: 'stop-2', status: 'COMPLETED', actual_stop_duration_minutes: 15 },
        { id: 'stop-3', status: 'PENDING' },
        { id: 'stop-4', status: 'FAILED' },
        { id: 'stop-5', status: 'SKIPPED' },
      ];

      const route = {
        id: 'route-1',
        route_code: 'RT-20241214-001',
        status: RouteStatus.IN_PROGRESS,
        total_distance: 75,
        total_duration: 180,
        stops,
      };
      mockRouteRepository.findOne.mockResolvedValue(route);

      const result = await service.calculateRouteMetrics('route-1');

      expect(result.total_stops).toBe(5);
      expect(result.completed_stops).toBe(2);
      expect(result.failed_stops).toBe(1);
      expect(result.skipped_stops).toBe(1);
      expect(result.pending_stops).toBe(1);
      expect(result.completion_percentage).toBe(40); // 2/5 = 40%
      expect(result.average_stop_duration_minutes).toBe(13); // (10+15)/2 ≈ 12.5 → 13
    });

    it('deve calcular paradas no prazo vs atrasadas', async () => {
      const now = new Date();
      const stops = [
        {
          id: 'stop-1',
          status: 'COMPLETED',
          planned_arrival_time: '10:00',
          actual_arrival_time: new Date(now.setHours(9, 55)), // 5 min antes
          getDelayMinutes: () => -5,
        },
        {
          id: 'stop-2',
          status: 'COMPLETED',
          planned_arrival_time: '11:00',
          actual_arrival_time: new Date(now.setHours(11, 30)), // 30 min depois
          getDelayMinutes: () => 30,
        },
        {
          id: 'stop-3',
          status: 'COMPLETED',
          planned_arrival_time: '12:00',
          actual_arrival_time: new Date(now.setHours(12, 0)), // no horário
          getDelayMinutes: () => 0,
        },
      ];

      const route = {
        id: 'route-1',
        route_code: 'RT-20241214-001',
        status: RouteStatus.COMPLETED,
        total_distance: 50,
        total_duration: 120,
        stops,
      };
      mockRouteRepository.findOne.mockResolvedValue(route);

      const result = await service.calculateRouteMetrics('route-1');

      expect(result.on_time_stops).toBe(2); // 2 paradas no prazo (cedo ou no horário)
      expect(result.delayed_stops).toBe(1); // 1 parada atrasada
      expect(result.total_delay_minutes).toBe(30);
    });
  });

  describe('updateRouteMetrics', () => {
    it('deve atualizar contadores da rota', async () => {
      const stops = [
        { id: 'stop-1', status: 'COMPLETED' },
        { id: 'stop-2', status: 'COMPLETED' },
        { id: 'stop-3', status: 'FAILED' },
        { id: 'stop-4', status: 'PENDING' },
      ];

      const route = {
        id: 'route-1',
        stops,
        total_deliveries: 0,
        completed_deliveries: 0,
        failed_deliveries: 0,
      };

      mockRouteRepository.findOne.mockResolvedValue(route);
      mockRouteRepository.save.mockResolvedValue(route);

      await service.updateRouteMetrics('route-1');

      expect(route.total_deliveries).toBe(4);
      expect(route.completed_deliveries).toBe(2);
      expect(route.failed_deliveries).toBe(1);
    });
  });

  describe('generatePerformanceReport', () => {
    it('deve gerar relatório com insights', async () => {
      const route = {
        id: 'route-1',
        route_code: 'RT-20241214-001',
        status: RouteStatus.COMPLETED,
        total_distance: 100,
        total_duration: 300,
        stops: [
          { id: 'stop-1', status: 'COMPLETED' },
          { id: 'stop-2', status: 'COMPLETED' },
          { id: 'stop-3', status: 'COMPLETED' },
        ],
      };
      mockRouteRepository.findOne.mockResolvedValue(route);

      const result = await service.generatePerformanceReport('route-1');

      expect(result).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.insights).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.insights)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });

  describe('getAggregatedMetrics', () => {
    it('deve calcular métricas agregadas para período', async () => {
      const routes = [
        {
          id: 'route-1',
          status: RouteStatus.COMPLETED,
          total_distance: 50,
          total_duration: 120,
          stops: [{ status: 'COMPLETED' }, { status: 'COMPLETED' }],
          planned_date: '2024-12-10',
        },
        {
          id: 'route-2',
          status: RouteStatus.COMPLETED,
          total_distance: 75,
          total_duration: 180,
          stops: [{ status: 'COMPLETED' }, { status: 'FAILED' }],
          planned_date: '2024-12-15',
        },
        {
          id: 'route-3',
          status: RouteStatus.IN_PROGRESS,
          total_distance: 40,
          total_duration: 100,
          stops: [{ status: 'PENDING' }],
          planned_date: '2024-12-20',
        },
      ];

      mockRouteRepository.find.mockResolvedValue(routes);

      const startDate = new Date('2024-12-01');
      const endDate = new Date('2024-12-31');

      const result = await service.getAggregatedMetrics(startDate, endDate);

      expect(result.total_routes).toBe(3);
      expect(result.completed_routes).toBe(2);
      expect(result.in_progress_routes).toBe(1);
      expect(result.total_distance_km).toBe(165); // 50 + 75 + 40
      expect(result.average_route_distance_km).toBe(55); // 165 / 3
    });
  });
});
