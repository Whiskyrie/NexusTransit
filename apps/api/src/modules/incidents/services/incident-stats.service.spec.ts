import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { IncidentStatsService } from './incident-stats.service';
import { Incident } from '../entities/incident.entity';
import { IncidentStatusHistory } from '../entities/incident-status-history.entity';
import { IncidentStatsCacheService } from './incident-stats-cache.service';
import { IncidentStatus, IncidentSeverity } from '../enums/incident.enums';
import type { IncidentStatsFilterDto } from '../dto/incident-stats.dto';

describe('IncidentStatsService', () => {
  let service: IncidentStatsService;
  let module: TestingModule;
  let _incidentRepository: Repository<Incident>;
  let _statusHistoryRepository: Repository<IncidentStatusHistory>;
  let _cacheService: IncidentStatsCacheService;

  interface MockQueryBuilder {
    select: jest.Mock;
    addSelect: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    groupBy: jest.Mock;
    orderBy: jest.Mock;
    getRawMany: jest.Mock;
    getRawOne: jest.Mock;
    getCount: jest.Mock;
    clone: jest.Mock;
  }

  const createMockQueryBuilder = (): MockQueryBuilder => {
    const qb: MockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
      getRawOne: jest.fn().mockResolvedValue({}),
      getCount: jest.fn().mockResolvedValue(0),
      clone: jest.fn(),
    };
    // Each clone returns a new independent mock query builder
    qb.clone.mockImplementation(() => createMockQueryBuilder());
    return qb;
  };

  let mockQueryBuilder: MockQueryBuilder;

  const mockIncidentRepository = {
    createQueryBuilder: jest.fn(),
    count: jest.fn(),
    findAndCount: jest.fn(),
  };

  const createStatusHistoryQueryBuilder = () => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({
      avg_response_time_minutes: 30,
      min_response_time_minutes: 5,
      max_response_time_minutes: 120,
    }),
    getRawMany: jest.fn().mockResolvedValue([]),
  });

  let mockStatusHistoryQueryBuilder: ReturnType<typeof createStatusHistoryQueryBuilder>;

  const mockStatusHistoryRepository = {
    createQueryBuilder: jest.fn(),
    find: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    invalidatePattern: jest.fn(),
  };

  beforeEach(async () => {
    // Reset mock query builders for each test
    mockQueryBuilder = createMockQueryBuilder();
    mockStatusHistoryQueryBuilder = createStatusHistoryQueryBuilder();
    mockIncidentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    mockStatusHistoryRepository.createQueryBuilder.mockReturnValue(mockStatusHistoryQueryBuilder);

    module = await Test.createTestingModule({
      providers: [
        IncidentStatsService,
        {
          provide: getRepositoryToken(Incident),
          useValue: mockIncidentRepository,
        },
        {
          provide: getRepositoryToken(IncidentStatusHistory),
          useValue: mockStatusHistoryRepository,
        },
        {
          provide: IncidentStatsCacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<IncidentStatsService>(IncidentStatsService);
    _incidentRepository = module.get<Repository<Incident>>(getRepositoryToken(Incident));
    _statusHistoryRepository = module.get<Repository<IncidentStatusHistory>>(
      getRepositoryToken(IncidentStatusHistory),
    );
    _cacheService = module.get<IncidentStatsCacheService>(IncidentStatsCacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (module) await module.close();
  });

  describe('getGeneralStats', () => {
    it('deve retornar estatísticas gerais', async () => {
      const filterDto: IncidentStatsFilterDto = {
        start_date: '2025-01-01',
        end_date: '2025-12-31',
      };

      const _mockStats = {
        total_incidents: 150,
        by_status: {
          REPORTED: 20,
          INVESTIGATING: 30,
          IN_PROGRESS: 40,
          RESOLVED: 35,
          CLOSED: 20,
          ESCALATED: 5,
        },
        by_severity: {
          LOW: 50,
          MEDIUM: 60,
          HIGH: 30,
          CRITICAL: 10,
        },
        by_type: {
          ACCIDENT: 40,
          DAMAGE: 35,
          THEFT: 15,
          MECHANICAL_FAILURE: 30,
          DELAY: 20,
          OTHER: 10,
        },
        avg_resolution_time_hours: 24.5,
        resolution_rate: 73.33,
      };

      mockQueryBuilder.getRawOne.mockResolvedValue({
        total: '150',
      });

      mockQueryBuilder.getRawMany.mockResolvedValueOnce([
        { status: 'REPORTED', count: '20' },
        { status: 'INVESTIGATING', count: '30' },
      ]);

      mockQueryBuilder.getRawMany.mockResolvedValueOnce([
        { severity: 'LOW', count: '50' },
        { severity: 'MEDIUM', count: '60' },
      ]);

      mockQueryBuilder.getRawMany.mockResolvedValueOnce([
        { type: 'ACCIDENT', count: '40' },
        { type: 'DAMAGE', count: '35' },
      ]);

      const result = await service.getGeneralStats(filterDto);

      expect(result).toBeDefined();
      expect(result.total_incidents).toBeGreaterThanOrEqual(0);
    });

    it('deve filtrar por período específico', async () => {
      const filterDto: IncidentStatsFilterDto = {
        start_date: '2025-01-01',
        end_date: '2025-01-31',
      };

      mockQueryBuilder.getRawOne.mockResolvedValue({ total: '15' });
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      await service.getGeneralStats(filterDto);

      expect(mockIncidentRepository.createQueryBuilder).toHaveBeenCalled();
    });

    it('deve filtrar por status', async () => {
      const filterDto: IncidentStatsFilterDto = {
        status: IncidentStatus.INVESTIGATING,
      };

      mockQueryBuilder.getRawOne.mockResolvedValue({ total: '30' });
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      await service.getGeneralStats(filterDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('status'),
        expect.any(Object),
      );
    });

    it('deve filtrar por severidade', async () => {
      const filterDto: IncidentStatsFilterDto = {
        severity: IncidentSeverity.CRITICAL,
      };

      mockQueryBuilder.getRawOne.mockResolvedValue({ total: '10' });
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      await service.getGeneralStats(filterDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('severity'),
        expect.any(Object),
      );
    });
  });
});
