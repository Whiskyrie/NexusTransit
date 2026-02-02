import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TrackingCalculationService } from './tracking-calculation.service';
import { TrackingEvent } from '../entities/tracking-event.entity';
import { EventType } from '../enums/event-type.enum';
import { EventStatus } from '../enums/event-status.enum';

describe('TrackingCalculationService', () => {
  let service: TrackingCalculationService;
  let module: TestingModule;

  const mockEvent = {
    id: 'test-id',
    event_id: 'evt-123',
    delivery_id: 'delivery-123',
    driver_id: 'driver-123',
    event_type: EventType.IN_TRANSIT,
    event_status: EventStatus.SUCCESS,
    timestamp: new Date('2025-12-18T10:00:00Z'),
    location: 'POINT(-46.6333 -23.5505)',
    speed: 60,
    getCoordinates: jest.fn().mockReturnValue({
      latitude: -23.5505,
      longitude: -46.6333,
    }),
  };

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    query: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
      getRawOne: jest.fn(),
    })),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        TrackingCalculationService,
        {
          provide: getRepositoryToken(TrackingEvent),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TrackingCalculationService>(TrackingCalculationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('calculateDistanceBetweenEvents', () => {
    it('should calculate distance between two events', async () => {
      mockRepository.query = jest.fn().mockResolvedValue([
        {
          distance_meters: '1500',
        },
      ]);

      const result = await service.calculateDistanceBetweenEvents('evt-1', 'evt-2');

      expect(result).toEqual({
        distance_meters: 1500,
        distance_km: 1.5,
      });
    });

    it('should return zero when events have no location', async () => {
      mockRepository.query = jest.fn().mockResolvedValue([
        {
          distance_meters: '0',
        },
      ]);

      const result = await service.calculateDistanceBetweenEvents('evt-1', 'evt-2');

      expect(result.distance_meters).toBe(0);
      expect(result.distance_km).toBe(0);
    });
  });

  describe('calculateDistanceBetweenCoordinates', () => {
    it('should calculate distance between coordinates', async () => {
      mockRepository.query = jest.fn().mockResolvedValue([
        {
          distance_meters: '5000',
        },
      ]);

      const result = await service.calculateDistanceBetweenCoordinates(
        -23.5505,
        -46.6333,
        -23.5605,
        -46.6433,
      );

      expect(result).toEqual({
        distance_meters: 5000,
        distance_km: 5,
      });
    });
  });

  describe('calculateTotalDistance', () => {
    it('should calculate total distance for a delivery', async () => {
      mockRepository.query = jest.fn().mockResolvedValue([
        {
          total_distance_meters: '15000',
        },
      ]);

      const result = await service.calculateTotalDistance('delivery-123');

      expect(result).toEqual({
        distance_meters: 15000,
        distance_km: 15,
      });
    });

    it('should return zero when no events with location', async () => {
      mockRepository.query = jest.fn().mockResolvedValue([
        {
          total_distance_meters: '0',
        },
      ]);

      const result = await service.calculateTotalDistance('delivery-123');

      expect(result.distance_km).toBe(0);
      expect(result.distance_meters).toBe(0);
    });
  });

  describe('calculateAverageSpeed', () => {
    it('should calculate average speed', async () => {
      mockRepository.query = jest.fn().mockResolvedValue([
        {
          distance_meters: '5000',
          duration_minutes: '5',
        },
        {
          distance_meters: '6000',
          duration_minutes: '6',
        },
      ]);

      const result = await service.calculateAverageSpeed('delivery-123');

      expect(result).toBeGreaterThan(0);
      expect(typeof result).toBe('number');
    });

    it('should return zero when no speed data', async () => {
      mockRepository.query = jest.fn().mockResolvedValue([]);

      const result = await service.calculateAverageSpeed('delivery-123');

      expect(result).toBe(0);
    });
  });

  describe('calculateETA', () => {
    it('should calculate ETA based on average speed', async () => {
      mockRepository.findOne.mockResolvedValue(mockEvent);

      // Mockar calculateDistanceBetweenCoordinates
      jest.spyOn(service, 'calculateDistanceBetweenCoordinates').mockResolvedValue({
        distance_meters: 30000,
        distance_km: 30,
      });

      // Mockar calculateAverageSpeed
      jest.spyOn(service, 'calculateAverageSpeed').mockResolvedValue(60); // 60 km/h

      const result = await service.calculateETA('delivery-123', -23.5605, -46.6433);

      expect(result.remaining_distance_km).toBe(30);
      expect(result.estimated_arrival).toBeInstanceOf(Date);
    });

    it('should throw error when no location available', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockEvent, location: null });

      await expect(service.calculateETA('delivery-123', -23.5605, -46.6433)).rejects.toThrow();
    });
  });

  describe('detectDelay', () => {
    it('should detect delay when ETA exceeds expected arrival', async () => {
      const expectedArrival = new Date('2025-12-18T12:00:00Z');
      const estimatedArrival = new Date('2025-12-18T14:00:00Z'); // 2 horas de atraso

      // Mockar calculateETA para retornar um horário posterior ao esperado
      jest.spyOn(service, 'calculateETA').mockResolvedValue({
        estimated_arrival: estimatedArrival,
        remaining_distance_km: 60,
        average_speed_kmh: 30,
        estimated_duration_minutes: 120,
      });

      const result = await service.detectDelay('delivery-123', expectedArrival, -23.5605, -46.6433);

      expect(result.is_delayed).toBe(true);
      expect(result.delay_minutes).toBeGreaterThan(0);
    });

    it('should not detect delay when on time', async () => {
      const expectedArrival = new Date('2025-12-18T15:00:00Z');
      const estimatedArrival = new Date('2025-12-18T14:50:00Z'); // 10 minutos antes

      // Mockar calculateETA para retornar um horário anterior ao esperado
      jest.spyOn(service, 'calculateETA').mockResolvedValue({
        estimated_arrival: estimatedArrival,
        remaining_distance_km: 10,
        average_speed_kmh: 60,
        estimated_duration_minutes: 10,
      });

      const result = await service.detectDelay('delivery-123', expectedArrival, -23.5605, -46.6433);

      expect(result.is_delayed).toBe(false);
    });
  });

  describe('isNearDestination', () => {
    it('should return true when near destination', async () => {
      mockRepository.findOne.mockResolvedValue(mockEvent);
      mockRepository.query = jest.fn().mockResolvedValue([
        {
          distance_meters: '1500',
        },
      ]);

      const result = await service.isNearDestination('delivery-123', -23.5515, -46.6343);

      expect(result).toBe(true);
    });

    it('should return false when far from destination', async () => {
      mockRepository.findOne.mockResolvedValue(mockEvent);
      mockRepository.query = jest.fn().mockResolvedValue([
        {
          distance_meters: '5000',
        },
      ]);

      const result = await service.isNearDestination('delivery-123', -23.5515, -46.6343);

      expect(result).toBe(false);
    });

    it('should return false when no location available', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockEvent, location: null });

      const result = await service.isNearDestination('delivery-123', -23.5515, -46.6343);

      expect(result).toBe(false);
    });
  });

  describe('hasArrived', () => {
    it('should return true when within arrival radius', async () => {
      mockRepository.findOne.mockResolvedValue(mockEvent);
      mockRepository.query = jest.fn().mockResolvedValue([
        {
          distance_meters: '50',
        },
      ]);

      const result = await service.hasArrived('delivery-123', -23.5505, -46.6333);

      expect(result).toBe(true);
    });

    it('should return false when outside arrival radius', async () => {
      mockRepository.findOne.mockResolvedValue(mockEvent);
      mockRepository.query = jest.fn().mockResolvedValue([
        {
          distance_meters: '200',
        },
      ]);

      const result = await service.hasArrived('delivery-123', -23.5505, -46.6333);

      expect(result).toBe(false);
    });
  });

  describe('detectUnscheduledStops', () => {
    it('should detect stops longer than threshold', async () => {
      const mockStops = [
        {
          event_id: 'evt-123',
          timestamp: new Date('2025-12-18T10:00:00Z'),
          latitude: '-23.5505',
          longitude: '-46.6333',
          duration_minutes: '30',
          distance_meters: '10',
        },
      ];

      mockRepository.query = jest.fn().mockResolvedValue(mockStops);

      const result = await service.detectUnscheduledStops('delivery-123');

      expect(result).toHaveLength(1);
      expect(result[0].stop_duration_minutes).toBe(30);
    });
  });

  describe('detectRouteDeviation', () => {
    it('should detect route deviations', async () => {
      mockRepository.findOne = jest.fn().mockResolvedValue({
        event_id: 'evt-123',
        location: 'POINT(-46.6333 -23.5505)',
      });
      mockRepository.query = jest.fn().mockResolvedValue([{ deviation_meters: '1500' }]);

      const result = await service.detectRouteDeviation(
        'delivery-123',
        'LINESTRING(0 0, 10 10)',
        1000,
      );

      expect(result.is_deviated).toBe(true);
      expect(result.deviation_distance_meters).toBe(1500);
    });

    it('should return no deviation when within tolerance', async () => {
      mockRepository.findOne = jest.fn().mockResolvedValue({
        event_id: 'evt-123',
        location: 'POINT(-46.6333 -23.5505)',
      });
      mockRepository.query = jest.fn().mockResolvedValue([{ deviation_meters: '100' }]);

      const result = await service.detectRouteDeviation(
        'delivery-123',
        'LINESTRING(0 0, 10 10)',
        1000,
      );

      expect(result.is_deviated).toBe(false);
      expect(result.deviation_distance_meters).toBe(100);
    });
  });
});
