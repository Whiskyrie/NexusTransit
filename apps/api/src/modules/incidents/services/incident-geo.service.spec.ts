import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { IncidentGeoService } from './incident-geo.service';
import { Incident } from '../entities/incident.entity';
import type { NearbyIncidentsDto } from '../dto/nearby-incidents.dto';
import type { WithinAreaDto } from '../dto/within-area.dto';
import { IncidentStatus } from '../enums/incident.enums';

describe('IncidentGeoService', () => {
  let service: IncidentGeoService;
  let _incidentRepository: Repository<Incident>;

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([]),
    getMany: jest.fn().mockResolvedValue([]),
  };

  const mockIncidentRepository = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentGeoService,
        {
          provide: getRepositoryToken(Incident),
          useValue: mockIncidentRepository,
        },
      ],
    }).compile();

    service = module.get<IncidentGeoService>(IncidentGeoService);
    _incidentRepository = module.get<Repository<Incident>>(getRepositoryToken(Incident));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findNearby', () => {
    it('deve buscar incidentes próximos com sucesso', async () => {
      const dto: NearbyIncidentsDto = {
        latitude: -23.5505,
        longitude: -46.6333,
        radius_meters: 5000,
        limit: 50,
      };

      const mockResults = [
        {
          id: '1',
          incident_number: 'INC-2025-0001',
          title: 'Incidente próximo 1',
          latitude: -23.5506,
          longitude: -46.6334,
          distance_meters: 150,
        },
        {
          id: '2',
          incident_number: 'INC-2025-0002',
          title: 'Incidente próximo 2',
          latitude: -23.551,
          longitude: -46.634,
          distance_meters: 350,
        },
      ];

      mockQueryBuilder.getRawMany.mockResolvedValue(mockResults);

      const result = await service.findNearby(dto);

      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(mockIncidentRepository.createQueryBuilder).toHaveBeenCalledWith('incident');
      expect(mockQueryBuilder.setParameters).toHaveBeenCalledWith({
        latitude: dto.latitude,
        longitude: dto.longitude,
        radius: dto.radius_meters,
      });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('distance_meters', 'ASC');
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(50);
    });

    it('deve filtrar por status quando fornecido', async () => {
      const dto: NearbyIncidentsDto = {
        latitude: -23.5505,
        longitude: -46.6333,
        radius_meters: 5000,
        status: IncidentStatus.INVESTIGATING,
      };

      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      await service.findNearby(dto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('incident.status = :status', {
        status: IncidentStatus.INVESTIGATING,
      });
    });

    it('deve usar raio padrão de 5000m se não fornecido', async () => {
      const dto: NearbyIncidentsDto = {
        latitude: -23.5505,
        longitude: -46.6333,
      };

      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      await service.findNearby(dto);

      expect(mockQueryBuilder.setParameters).toHaveBeenCalledWith(
        expect.objectContaining({
          radius: 5000,
        }),
      );
    });

    it('deve retornar array vazio se não houver incidentes próximos', async () => {
      const dto: NearbyIncidentsDto = {
        latitude: -23.5505,
        longitude: -46.6333,
        radius_meters: 1000,
      };

      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await service.findNearby(dto);

      expect(result).toEqual([]);
    });

    it('deve ordenar resultados por distância crescente', async () => {
      const dto: NearbyIncidentsDto = {
        latitude: -23.5505,
        longitude: -46.6333,
        radius_meters: 10000,
      };

      const mockResults = [
        { id: '1', distance_meters: 100 },
        { id: '2', distance_meters: 500 },
        { id: '3', distance_meters: 1500 },
      ];

      mockQueryBuilder.getRawMany.mockResolvedValue(mockResults);

      const result = await service.findNearby(dto);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('distance_meters', 'ASC');
      expect(result[0].distance_meters).toBeLessThanOrEqual(result[1].distance_meters);
    });
  });

  describe('findWithinArea', () => {
    it('deve buscar incidentes dentro de área poligonal', async () => {
      const dto: WithinAreaDto = {
        coordinates: [
          { latitude: -23.5505, longitude: -46.6333 },
          { latitude: -23.551, longitude: -46.6333 },
          { latitude: -23.551, longitude: -46.634 },
          { latitude: -23.5505, longitude: -46.634 },
          { latitude: -23.5505, longitude: -46.6333 }, // Fechado
        ],
        limit: 100,
      };

      const mockResults = [
        {
          id: '1',
          incident_number: 'INC-2025-0001',
          title: 'Incidente na área',
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockResults);

      const result = await service.findWithinArea(dto);

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(mockIncidentRepository.createQueryBuilder).toHaveBeenCalled();
    });

    it('deve rejeitar polígono não fechado', async () => {
      const dto: WithinAreaDto = {
        coordinates: [
          { latitude: -23.5505, longitude: -46.6333 },
          { latitude: -23.551, longitude: -46.6333 },
          { latitude: -23.551, longitude: -46.634 },
          { latitude: -23.5505, longitude: -46.634 },
          // Não fechado
        ],
      };

      await expect(service.findWithinArea(dto)).rejects.toThrow('polígono deve ser fechado');
    });

    it('deve filtrar por status na área', async () => {
      const dto: WithinAreaDto = {
        coordinates: [
          { latitude: -23.5505, longitude: -46.6333 },
          { latitude: -23.551, longitude: -46.6333 },
          { latitude: -23.551, longitude: -46.634 },
          { latitude: -23.5505, longitude: -46.634 },
          { latitude: -23.5505, longitude: -46.6333 },
        ],
        status: IncidentStatus.RESOLVED,
      };

      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      await service.findWithinArea(dto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('incident.status = :status', {
        status: IncidentStatus.RESOLVED,
      });
    });

    it('deve retornar array vazio se não houver incidentes na área', async () => {
      const dto: WithinAreaDto = {
        coordinates: [
          { latitude: -23.5505, longitude: -46.6333 },
          { latitude: -23.551, longitude: -46.6333 },
          { latitude: -23.551, longitude: -46.634 },
          { latitude: -23.5505, longitude: -46.634 },
          { latitude: -23.5505, longitude: -46.6333 },
        ],
      };

      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.findWithinArea(dto);

      expect(result).toEqual([]);
    });
  });

  describe('isPolygonClosed', () => {
    it('deve validar polígono fechado corretamente', () => {
      const coordinates = [
        { latitude: -23.5505, longitude: -46.6333 },
        { latitude: -23.551, longitude: -46.6333 },
        { latitude: -23.551, longitude: -46.634 },
        { latitude: -23.5505, longitude: -46.634 },
        { latitude: -23.5505, longitude: -46.6333 },
      ];

      const result = (service as any).isPolygonClosed(coordinates);

      expect(result).toBe(true);
    });

    it('deve detectar polígono não fechado', () => {
      const coordinates = [
        { latitude: -23.5505, longitude: -46.6333 },
        { latitude: -23.551, longitude: -46.6333 },
        { latitude: -23.551, longitude: -46.634 },
        { latitude: -23.5505, longitude: -46.634 },
      ];

      const result = (service as any).isPolygonClosed(coordinates);

      expect(result).toBe(false);
    });
  });
});
